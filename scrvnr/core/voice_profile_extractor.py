"""
GHM SCRVNR — Voice Profile Extractor
======================================
Captures voice DNA from source text (scraped from live site or pasted).
Populates a voice_profile.json conforming to voice_profile_schema.json.

This is the DNA Lab engine. It runs at profile creation time —
not at content-generation time. Run once per brand, update when voice
changes substantially.

The extractor uses only statistical and pattern-based analysis.
No LLM required. Outputs a profile ready for Pass 2 alignment scoring.

Usage:
    extractor = VoiceProfileExtractor()

    # From raw text
    profile = extractor.extract(
        text=page_text,
        client_slug="german-auto-doctor",
        brand_slug="main",
        brand_display_name="German Auto Doctor",
        source_url="https://germanauto.doctor",
        tier_scope=["T1", "T2"]
    )

    # Save to file
    extractor.save(profile, "profiles/gad-main.json")

Confidence levels:
    high   — metric extracted from sufficient sample (>500 words)
    medium — metric estimated from limited sample (200-500 words)
    low    — metric inferred from minimal data (<200 words); needs human review
"""

import re
import json
import math
import statistics
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class VoiceProfileExtractor:
    """
    Extract voice DNA from source copy.
    All analysis is statistical — no external services required.
    """

    MIN_WORDS_HIGH_CONFIDENCE = 500
    MIN_WORDS_MEDIUM_CONFIDENCE = 200

    # Standard contractions to detect
    CONTRACTIONS = [
        "it's", "you'll", "here's", "that's", "don't", "won't", "can't",
        "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
        "hadn't", "i'm", "you're", "we're", "they're", "i've", "we've",
        "they've", "i'd", "you'd", "we'd", "they'd", "what's", "where's",
        "when's", "who's", "how's", "there's", "let's", "didn't", "doesn't",
        "couldn't", "shouldn't", "wouldn't", "mustn't", "shan't"
    ]

    # Trust signal pattern markers
    TRUST_PATTERNS = {
        "certification-led": [
            "certified", "ase certified", "factory trained", "manufacturer certified",
            "certified technician", "oem certified", "authorized service"
        ],
        "tenure-referenced": [
            "years of experience", "years serving", "since", "over a decade",
            "over 20 years", "established in", "founded in", "serving since"
        ],
        "specific-claim": [
            "we fix", "we repair", "we specialize", "only shop", "only dealership",
            "exclusive", "guaranteed", "warranty", "we promise"
        ],
        "social-proof": [
            "customers say", "reviews", "rated", "stars", "testimonials",
            "trusted by", "chosen by", "customers trust"
        ],
        "authority-led": [
            "expert", "specialist", "master technician", "factory expert",
            "brand specialist", "authorized by", "endorsed by"
        ],
    }

    # Hedging words to detect (used for formality estimation)
    HEDGES = [
        "perhaps", "maybe", "possibly", "potentially", "somewhat",
        "fairly", "rather", "quite", "a bit", "generally", "typically",
        "usually", "often", "sometimes", "in most cases"
    ]

    # Formal/warm markers for register estimation
    FORMAL_MARKERS = [
        "however", "therefore", "furthermore", "regarding", "pursuant",
        "herein", "aforementioned", "notwithstanding", "in accordance"
    ]
    CASUAL_MARKERS = ["it's", "you'll", "gonna", "don't", "won't", "can't", "here's", "let's"]
    WARM_MARKERS = ["you", "your", "we", "our", "together", "help", "care", "family", "trust"]
    COLD_MARKERS = ["the client", "the customer", "users", "end users", "personnel", "individuals"]

    def extract(
        self,
        text: str,
        client_slug: str,
        brand_slug: str,
        brand_display_name: str = "",
        source_url: str = "",
        source_pages_sampled: List[str] = None,
        tier_scope: List[str] = None,
        capture_method: str = "extraction",
    ) -> Dict:
        """
        Extract voice DNA from source text.

        Returns a populated profile dict conforming to voice_profile_schema.json.
        """
        text = text.strip()
        word_count = len(text.split())
        confidence_level = self._confidence_level(word_count)

        profile = {
            "profile_id": f"{client_slug}-{brand_slug}",
            "client_slug": client_slug,
            "brand_slug": brand_slug,
            "brand_display_name": brand_display_name or brand_slug,
            "tier_scope": tier_scope or ["T1", "T2", "T3"],
            "created": datetime.utcnow().isoformat() + "Z",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "source_url": source_url,
            "source_pages_sampled": source_pages_sampled or ([source_url] if source_url else []),
            "capture_method": capture_method,
        }

        # ── Reading Level ──────────────────────────────────────────────────────
        fk_grade = self._estimate_fk_grade(text)
        profile["reading_level"] = {
            "flesch_kincaid_grade": round(fk_grade, 1),
            "description": f"FK grade {fk_grade:.1f} extracted from source copy ({word_count} words)",
            "target_min": round(max(1.0, fk_grade - 1.5), 1),
            "target_max": round(min(20.0, fk_grade + 1.5), 1),
            "tolerance": 1.5,
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Sentence Rhythm ────────────────────────────────────────────────────
        sentences = self._split_sentences(text)
        lengths = [len(s.split()) for s in sentences if s.strip() and len(s.split()) >= 2]
        if len(lengths) >= 3:
            mean_len = statistics.mean(lengths)
            std_dev = statistics.stdev(lengths)
            burstiness = round(std_dev / mean_len, 3) if mean_len > 0 else 0
        else:
            mean_len = word_count
            std_dev = 0
            burstiness = None

        profile["sentence_rhythm"] = {
            "avg_length_words": round(mean_len, 1) if lengths else None,
            "std_dev_words": round(std_dev, 1) if lengths else None,
            "burstiness_score": burstiness,
            "description": "Burstiness: ratio of std_dev to mean sentence length. >0.60 = human-natural variance.",
            "target_burstiness_min": 0.60,
            "tolerance": 0.1,
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Contraction Rate ───────────────────────────────────────────────────
        contraction_rate = self._measure_contraction_rate(text)
        profile["contraction_rate"] = {
            "measured": round(contraction_rate, 3),
            "description": "Fraction of eligible positions where contractions appear (0.0-1.0).",
            "target_min": round(max(0.0, contraction_rate - 0.10), 3),
            "target_max": round(min(1.0, contraction_rate + 0.10), 3),
            "tolerance": 0.10,
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Technical Specificity ──────────────────────────────────────────────
        specificity_level, specificity_markers = self._measure_specificity(text)
        profile["technical_specificity"] = {
            "level": specificity_level,
            "description": "low | moderate | high | very-high. Does copy commit to specific numbers, model names, measurements?",
            "markers_detected": specificity_markers[:10],
            "target": specificity_level,
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Register ───────────────────────────────────────────────────────────
        formality, warmth, primary_person = self._measure_register(text)
        profile["register"] = {
            "primary_person": primary_person,
            "description": "first | second | third. Grammatical person dominating the copy.",
            "formality_score": formality,
            "formality_description": "1-10. 1=very casual, 10=very formal.",
            "warmth_score": warmth,
            "warmth_description": "1-10. 1=clinical/cold, 10=conversational/warm.",
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Trust Signal Pattern ───────────────────────────────────────────────
        trust_type, trust_examples = self._detect_trust_pattern(text)
        profile["trust_signal_pattern"] = {
            "type": trust_type,
            "description": "certification-led | tenure-referenced | specific-claim | social-proof | authority-led | mixed",
            "examples_detected": trust_examples[:5],
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Native Constructions ───────────────────────────────────────────────
        native = self._extract_native_constructions(text)
        profile["native_constructions"] = {
            "description": "Phrases and structures native to this brand voice. Used in Pass 2 alignment scoring.",
            "items": native,
            "confidence_threshold": 0.70,
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Negative Space (human-defined by default) ─────────────────────────
        profile["negative_space"] = {
            "description": "What this voice never says. Patterns out of character. Requires human input to define accurately.",
            "items": [],
            "provenance": "human-defined",
            "locked": False,
            "override_note": None,
        }

        # ── Vocabulary ─────────────────────────────────────────────────────────
        vocab = self._analyze_vocabulary(text)
        profile["vocabulary"] = {
            "density_score": vocab["type_token_ratio"],
            "description": "Type-token ratio approximation. Higher = more varied vocabulary.",
            "domain_specific_terms": vocab["domain_terms"][:15],
            "characteristic_word_choices": vocab["characteristic_words"][:15],
            "avoided_terms": [],
            "provenance": "machine-extracted",
            "locked": False,
            "override_note": None,
        }

        # ── Capture Confidence ─────────────────────────────────────────────────
        per_field_confidence = {
            "reading_level": confidence_level if len(sentences) >= 5 else "low",
            "sentence_rhythm": confidence_level if len(sentences) >= 10 else "low",
            "contraction_rate": confidence_level,
            "technical_specificity": confidence_level,
            "register": confidence_level,
            "trust_signal_pattern": confidence_level,
            "native_constructions": "low" if word_count < 300 else confidence_level,
            "vocabulary": confidence_level,
        }
        low_confidence_flags = [k for k, v in per_field_confidence.items() if v == "low"]

        profile["capture_confidence"] = {
            "overall": confidence_level,
            "source_word_count": word_count,
            "per_field": per_field_confidence,
            "low_confidence_flags": low_confidence_flags,
            "notes": (
                f"Extracted from {word_count} words. "
                + ("Add more source text for higher confidence." if confidence_level != "high" else "Sufficient sample size.")
            ),
        }

        # ── Scaffold remaining required fields ────────────────────────────────
        profile["override_history"] = []
        profile["locked_fields"] = []
        profile["intake_interview_data"] = {
            "description": "For Tier 3 profiles built from scratch. Stores raw intake answers.",
            "completed": False,
            "answers": {},
        }

        return profile

    def save(self, profile: Dict, output_path: str) -> str:
        """Save profile to JSON file. Returns absolute path."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=2, ensure_ascii=False)
        return str(output_path.resolve())

    def update(self, existing_profile_path: str, new_text: str) -> Dict:
        """
        Update an existing profile with fresh source text.
        Recalculates machine-extracted fields. Preserves locked fields and
        human-defined data (negative_space, override_history, intake_interview_data).
        """
        with open(existing_profile_path, "r", encoding="utf-8") as f:
            existing = json.load(f)

        # Extract fresh data
        fresh = self.extract(
            text=new_text,
            client_slug=existing["client_slug"],
            brand_slug=existing["brand_slug"],
            brand_display_name=existing.get("brand_display_name", ""),
            source_url=existing.get("source_url", ""),
            tier_scope=existing.get("tier_scope", []),
        )

        # Merge: preserve locked fields and human-defined data
        locked_fields = existing.get("locked_fields", [])
        for field in locked_fields:
            if field in existing:
                fresh[field] = existing[field]

        # Always preserve human-defined fields
        fresh["negative_space"] = existing.get("negative_space", fresh["negative_space"])
        fresh["override_history"] = existing.get("override_history", [])
        fresh["intake_interview_data"] = existing.get("intake_interview_data", fresh["intake_interview_data"])
        fresh["created"] = existing.get("created", fresh["created"])
        fresh["last_updated"] = datetime.utcnow().isoformat() + "Z"

        # Append to pages sampled
        existing_pages = existing.get("source_pages_sampled", [])
        fresh_pages = fresh.get("source_pages_sampled", [])
        fresh["source_pages_sampled"] = list(set(existing_pages + fresh_pages))

        return fresh

    # ─── Extractors ───────────────────────────────────────────────────────────

    def _measure_specificity(self, text: str) -> Tuple[str, List[str]]:
        """Return specificity level and detected specific markers."""
        numbers = re.findall(r'\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:mph|rpm|miles|km|years?|months?|hours?|%|lbs?|kg|sq\s*ft|PSI|hp|L|liters?))?\b', text, re.IGNORECASE)
        model_names = re.findall(r'\b[A-Z][0-9]+\b|\b[A-Z]{2,}[0-9]+\b|\b(?:Series|Class|Type)\s+[A-Z0-9]+\b', text)
        proper_nouns = re.findall(r'(?<![.!?]\s)\b[A-Z][a-z]{2,}\b', text)
        measurements = re.findall(r'\b\d+(?:\.\d+)?\s*(?:mm|cm|in|ft|inches|degrees?|°F|°C|bar|psi|newton|nm|torque)\b', text, re.IGNORECASE)

        markers = list(set(numbers[:5] + model_names[:5] + measurements[:5]))

        word_count = max(1, len(text.split()))
        total_specifics = len(numbers) + len(model_names) * 2 + len(measurements) * 2
        density = (total_specifics / word_count) * 100

        if density >= 8:
            level = "very-high"
        elif density >= 5:
            level = "high"
        elif density >= 2:
            level = "moderate"
        else:
            level = "low"

        return level, markers

    def _measure_register(self, text: str) -> Tuple[int, int, str]:
        """Return (formality_1_10, warmth_1_10, primary_person)."""
        text_lower = text.lower()
        words = text_lower.split()

        # Primary person
        first_person = sum(1 for w in words if w in ("i", "we", "our", "us", "my"))
        second_person = sum(1 for w in words if w in ("you", "your", "yourself"))
        third_person = sum(1 for w in words if w in ("they", "their", "them", "it", "its"))

        max_count = max(first_person, second_person, third_person)
        if max_count == first_person:
            primary_person = "first"
        elif max_count == second_person:
            primary_person = "second"
        else:
            primary_person = "third"

        # Formality (1=casual, 10=formal)
        formal_count = sum(1 for w in self.FORMAL_MARKERS if w in text_lower)
        casual_count = sum(1 for w in self.CASUAL_MARKERS if w in text_lower)
        hedge_count = sum(1 for h in self.HEDGES if h in text_lower)

        if casual_count > formal_count:
            formality = max(1, 5 - min(3, casual_count - formal_count))
        else:
            formality = min(10, 5 + min(3, formal_count - casual_count))
        # Hedging adds slight formality
        formality = min(10, formality + min(1, hedge_count // 3))

        # Warmth (1=cold, 10=warm)
        warm_count = sum(1 for w in self.WARM_MARKERS if w in text_lower)
        cold_count = sum(1 for w in self.COLD_MARKERS if w in text_lower)
        second_person_density = second_person / max(1, len(words) / 100)

        warmth_base = 5
        warmth_base += min(3, warm_count - cold_count)
        warmth_base += min(2, int(second_person_density / 2))
        warmth = max(1, min(10, warmth_base))

        return int(formality), int(warmth), primary_person

    def _detect_trust_pattern(self, text: str) -> Tuple[str, List[str]]:
        """Identify the dominant trust signal pattern used in this copy."""
        text_lower = text.lower()
        pattern_hits = {}

        for pattern_type, phrases in self.TRUST_PATTERNS.items():
            hits = [p for p in phrases if p.lower() in text_lower]
            if hits:
                pattern_hits[pattern_type] = hits

        if not pattern_hits:
            return "undetected", []

        # If multiple types hit, classify as "mixed" if >1 category has hits
        if len(pattern_hits) > 1:
            # Pick dominant + label mixed
            dominant = max(pattern_hits, key=lambda k: len(pattern_hits[k]))
            all_examples = [ex for hits in pattern_hits.values() for ex in hits]
            return "mixed", all_examples[:5]

        dominant = list(pattern_hits.keys())[0]
        return dominant, pattern_hits[dominant]

    def _extract_native_constructions(self, text: str) -> List[Dict]:
        """
        Extract recurring phrases and constructions characteristic of this source.
        Returns list of {pattern, confidence, frequency} dicts.
        """
        # Extract 2-grams and 3-grams, find recurring ones
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        results = []

        # 3-grams
        trigrams = [" ".join(words[i:i+3]) for i in range(len(words)-2)]
        trigram_counts = Counter(trigrams)

        # 2-grams
        bigrams = [" ".join(words[i:i+2]) for i in range(len(words)-1)]
        bigram_counts = Counter(bigrams)

        # Filter stopword-dominated n-grams
        stopwords = {
            "the", "and", "for", "are", "but", "not", "you", "all", "any",
            "can", "had", "her", "was", "one", "our", "out", "day", "get",
            "has", "him", "his", "how", "its", "may", "new", "now", "old",
            "see", "two", "way", "who", "did", "let", "put", "say", "she",
            "too", "use", "will", "with", "this", "that", "from", "they",
            "have", "been", "more", "what", "when", "also", "into", "than",
            "then", "each", "over", "some", "your", "most", "very"
        }

        # Add recurring trigrams with frequency >= 2
        for phrase, count in trigram_counts.most_common(30):
            phrase_words = phrase.split()
            if all(w not in stopwords for w in phrase_words):
                if count >= 2:
                    results.append({
                        "pattern": phrase,
                        "confidence": min(0.95, 0.60 + count * 0.10),
                        "frequency": count,
                    })

        # Add recurring bigrams not covered by trigrams
        for phrase, count in bigram_counts.most_common(40):
            phrase_words = phrase.split()
            if all(w not in stopwords for w in phrase_words):
                if count >= 3:
                    # Don't add if it's a subset of an already-captured trigram
                    already_captured = any(phrase in r["pattern"] for r in results)
                    if not already_captured:
                        results.append({
                            "pattern": phrase,
                            "confidence": min(0.90, 0.55 + count * 0.08),
                            "frequency": count,
                        })

        # Sort by confidence descending
        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:20]

    def _analyze_vocabulary(self, text: str) -> Dict:
        """Analyze vocabulary richness and extract domain-specific terms."""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        if not words:
            return {"type_token_ratio": 0, "domain_terms": [], "characteristic_words": []}

        unique_words = set(words)
        ttr = round(len(unique_words) / len(words), 3)

        stopwords = {
            "the", "and", "for", "are", "but", "not", "you", "all", "any",
            "can", "had", "her", "was", "one", "our", "out", "day", "get",
            "has", "him", "his", "how", "its", "may", "new", "now", "old",
            "see", "two", "way", "who", "did", "let", "put", "say", "she",
            "too", "use", "will", "with", "this", "that", "from", "they",
            "have", "been", "more", "what", "when", "also", "into", "than",
            "then", "each", "over", "some", "your", "most", "very", "just",
            "which", "there", "their", "about", "would", "could", "should"
        }

        content_words = [w for w in words if w not in stopwords and len(w) >= 4]
        word_freq = Counter(content_words)

        # High-frequency content words = characteristic
        characteristic = [w for w, c in word_freq.most_common(30) if c >= 2]

        # Domain terms: longer words (7+ chars) appearing more than once
        domain_terms = [w for w, c in word_freq.most_common(50)
                       if len(w) >= 7 and c >= 2 and w not in stopwords]

        return {
            "type_token_ratio": ttr,
            "domain_terms": domain_terms[:20],
            "characteristic_words": characteristic[:20],
        }

    # ─── Utilities ────────────────────────────────────────────────────────────

    def _confidence_level(self, word_count: int) -> str:
        if word_count >= self.MIN_WORDS_HIGH_CONFIDENCE:
            return "high"
        elif word_count >= self.MIN_WORDS_MEDIUM_CONFIDENCE:
            return "medium"
        return "low"

    def _estimate_fk_grade(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = text.split()
        if not sentences or not words:
            return 8.0
        sentence_count = max(1, len(sentences))
        word_count = len(words)
        syllable_count = sum(self._estimate_syllables(w) for w in words)
        avg_sentence_length = word_count / sentence_count
        avg_syllables = syllable_count / word_count
        fk = 0.39 * avg_sentence_length + 11.8 * avg_syllables - 15.59
        return max(1.0, min(20.0, fk))

    def _estimate_syllables(self, word: str) -> int:
        word = word.lower().strip(".,!?;:\"'")
        if not word:
            return 1
        vowels = "aeiouy"
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith("e") and len(word) > 2:
            count = max(1, count - 1)
        return max(1, count)

    def _measure_contraction_rate(self, text: str) -> float:
        text_lower = text.lower()
        count = sum(1 for c in self.CONTRACTIONS if c in text_lower)
        words = len(text.split())
        opportunities = max(1, words / 8)
        return min(1.0, count / opportunities)

    def _split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z"])', text)
        return [s.strip() for s in sentences if s.strip() and len(s.split()) >= 2]


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json as _json

    if len(sys.argv) < 4:
        print("Usage: python voice_profile_extractor.py <source.txt> <client-slug> <brand-slug> [output.json]")
        sys.exit(1)

    source_path = sys.argv[1]
    client_slug = sys.argv[2]
    brand_slug = sys.argv[3]
    output_path = sys.argv[4] if len(sys.argv) > 4 else f"profiles/{client_slug}-{brand_slug}.json"

    with open(source_path, "r", encoding="utf-8") as f:
        text = f.read()

    extractor = VoiceProfileExtractor()
    profile = extractor.extract(
        text=text,
        client_slug=client_slug,
        brand_slug=brand_slug,
        brand_display_name=brand_slug.replace("-", " ").title(),
    )

    saved_path = extractor.save(profile, output_path)
    print(f"\n Voice profile extracted: {saved_path}")
    print(f"  Words sampled:    {profile['capture_confidence']['source_word_count']}")
    print(f"  Confidence:       {profile['capture_confidence']['overall']}")
    print(f"  Reading level:    FK Grade {profile['reading_level']['flesch_kincaid_grade']}")
    print(f"  Burstiness:       {profile['sentence_rhythm']['burstiness_score']}")
    print(f"  Contraction rate: {profile['contraction_rate']['measured']:.0%}")
    print(f"  Specificity:      {profile['technical_specificity']['level']}")
    print(f"  Formality:        {profile['register']['formality_score']}/10")
    print(f"  Warmth:           {profile['register']['warmth_score']}/10")
    print(f"  Trust pattern:    {profile['trust_signal_pattern']['type']}")
    print(f"  Native patterns:  {len(profile['native_constructions']['items'])} extracted")
    if profile["capture_confidence"]["low_confidence_flags"]:
        print(f"\n  Low confidence fields: {', '.join(profile['capture_confidence']['low_confidence_flags'])}")
        print("  Add more source text or complete DNA Lab interview for these fields.")
