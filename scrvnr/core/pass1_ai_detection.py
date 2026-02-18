"""
GHM SCRVNR — Pass 1: AI Detection Defense
==========================================
Analyzes copy for statistical markers associated with LLM-generated text.
No LLM required — all scoring is statistical and pattern-based.

Operates on individual sections (not full documents).
Returns per-section results with specific failure reasons.

Scoring dimensions:
  1. Burstiness         — sentence length variance (humans are bursty; LLMs are flat)
  2. Predictability     — known AI-ism phrase detection
  3. Parallel overuse   — structural tells (too many matching-length list items)
  4. Hedge density      — qualifiers and softening language
  5. Specificity score  — does the copy commit to real details?
  6. Transition tells   — overuse of formal transition words native to LLMs

Each dimension scores 0.0–1.0.
Overall Pass 1 score = weighted composite.
Threshold for pass: configurable, default 0.65.

Usage:
    detector = AIDetector()
    result = detector.analyze_section(text, section_name="hero")
    result = detector.analyze_document(sections_dict)
"""

import re
import math
import statistics
from typing import Dict, List, Tuple, Optional


class AIDetector:
    """
    Pass 1 engine: AI detection defense.
    No external dependencies. Pure Python stdlib.
    """

    PASS_THRESHOLD = 0.65  # Overall score required to pass

    # Known AI-ism phrases — phrases statistically overrepresented in LLM output.
    # Sourced from academic detection literature + empirical observation.
    AI_ISMS = [
        # Opening constructions
        "in the realm of", "in the world of", "in today's", "in an era of",
        "in a world where", "in the landscape of", "in the domain of",
        "navigating the complexities", "when it comes to",

        # Transition tells
        "furthermore", "moreover", "additionally", "in conclusion",
        "to summarize", "in summary", "it is worth noting", "it is important to note",
        "needless to say", "as mentioned", "as noted above", "it goes without saying",
        "last but not least",

        # Hedge constructions
        "it may be worth considering", "one might argue", "it could be said",
        "it is generally accepted", "it is widely recognized",
        "many experts believe", "studies suggest", "research indicates",
        "it is often said", "as many know",

        # Generic superlatives
        "world-class", "top-tier", "cutting-edge", "state-of-the-art",
        "industry-leading", "best-in-class", "unparalleled", "unmatched",
        "second to none", "bar none",

        # Trust signal AI-patterns (fake specificity)
        "a wide range of", "a variety of", "a number of", "various options",
        "numerous benefits", "countless advantages", "many years of experience",
        "decades of experience",

        # Passion/mission language
        "passionate about", "committed to excellence", "dedicated to providing",
        "our mission is to", "we are dedicated to", "we pride ourselves",
        "we are proud to", "our goal is to", "we strive to",

        # CTA AI-isms
        "look no further", "don't hesitate to", "feel free to contact",
        "we would love to hear", "we look forward to",

        # Structural tells
        "in addition to the above", "as a result", "due to the fact that",
        "in order to", "with that in mind", "that being said",
        "on the other hand", "on one hand",
    ]

    # Hedging qualifiers that soften and flatten voice
    HEDGE_WORDS = [
        "perhaps", "maybe", "possibly", "potentially", "somewhat",
        "fairly", "rather", "quite", "a bit", "a little",
        "sort of", "kind of", "generally", "typically", "usually",
        "often", "sometimes", "in most cases", "in many cases",
        "it seems", "it appears", "it would seem", "it would appear",
    ]

    # Formal transitions that LLMs overuse
    FORMAL_TRANSITIONS = [
        "furthermore", "moreover", "additionally", "consequently",
        "subsequently", "nevertheless", "nonetheless", "therefore",
        "thus", "hence", "accordingly", "as a result",
        "in conclusion", "to conclude", "in summary", "to summarize",
        "first and foremost", "last but not least", "in addition",
    ]

    def __init__(self, pass_threshold: float = None):
        self.pass_threshold = pass_threshold or self.PASS_THRESHOLD

    def analyze_section(self, text: str, section_name: str = "section") -> Dict:
        """
        Analyze a single section of copy.

        Returns:
            {
                section: str,
                pass: bool,
                overall_score: float,
                dimensions: {
                    burstiness: {...},
                    ai_isms: {...},
                    parallel_structure: {...},
                    hedge_density: {...},
                    specificity: {...},
                    transition_tells: {...}
                },
                failures: [str],
                suggestions: [str]
            }
        """
        text = text.strip()
        if not text:
            return self._empty_result(section_name)

        dimensions = {
            "burstiness": self._score_burstiness(text),
            "ai_isms": self._score_ai_isms(text),
            "parallel_structure": self._score_parallel_structure(text),
            "hedge_density": self._score_hedge_density(text),
            "specificity": self._score_specificity(text),
            "transition_tells": self._score_transition_tells(text),
        }

        # Weights — burstiness and ai_isms carry the most signal
        weights = {
            "burstiness": 0.25,
            "ai_isms": 0.25,
            "parallel_structure": 0.15,
            "hedge_density": 0.15,
            "specificity": 0.10,
            "transition_tells": 0.10,
        }

        overall_score = sum(
            dimensions[dim]["score"] * weights[dim]
            for dim in dimensions
        )

        failures = []
        suggestions = []
        for dim, result in dimensions.items():
            if result["score"] < 0.60:
                failures.append(result.get("failure_reason", f"{dim} below threshold"))
                suggestions.append(result.get("suggestion", f"Improve {dim}"))

        return {
            "section": section_name,
            "pass": overall_score >= self.pass_threshold,
            "overall_score": round(overall_score, 3),
            "threshold": self.pass_threshold,
            "dimensions": dimensions,
            "failures": failures,
            "suggestions": suggestions,
        }

    def analyze_document(self, sections: Dict[str, str]) -> Dict:
        """
        Analyze multiple named sections.

        Args:
            sections: dict of {section_name: text}

        Returns:
            {
                pass: bool,
                overall_score: float,
                sections_passed: int,
                sections_failed: int,
                section_results: {section_name: result},
                failed_sections: [section_name]
            }
        """
        section_results = {}
        for name, text in sections.items():
            section_results[name] = self.analyze_section(text, name)

        passed = [k for k, v in section_results.items() if v["pass"]]
        failed = [k for k, v in section_results.items() if not v["pass"]]

        scores = [v["overall_score"] for v in section_results.values()]
        overall = statistics.mean(scores) if scores else 0.0

        return {
            "pass": len(failed) == 0,
            "overall_score": round(overall, 3),
            "sections_passed": len(passed),
            "sections_failed": len(failed),
            "section_results": section_results,
            "failed_sections": failed,
        }

    # ─── Dimension Scorers ───────────────────────────────────────────────────

    def _score_burstiness(self, text: str) -> Dict:
        """
        Score sentence length variance.
        Humans write with natural rhythm — short punchy sentences followed by
        longer explanatory ones. LLMs tend toward uniform medium-length sentences.

        Burstiness = std_dev(lengths) / mean(lengths)
        Target: > 0.60 (higher = more human-natural)
        """
        sentences = self._split_sentences(text)
        if len(sentences) < 3:
            return {
                "score": 0.70,
                "burstiness": None,
                "note": "Too few sentences to score meaningfully",
                "sentence_count": len(sentences),
            }

        lengths = [len(s.split()) for s in sentences if s.strip()]
        if len(lengths) < 2:
            return {"score": 0.70, "burstiness": None, "note": "Insufficient sentences"}

        mean_len = statistics.mean(lengths)
        std_dev = statistics.stdev(lengths)
        burstiness = std_dev / mean_len if mean_len > 0 else 0

        # Scoring: >0.80 = excellent, 0.60-0.80 = good, 0.40-0.60 = borderline, <0.40 = flat
        if burstiness >= 0.80:
            score = 1.0
        elif burstiness >= 0.60:
            score = 0.75 + (burstiness - 0.60) * 1.25
        elif burstiness >= 0.40:
            score = 0.40 + (burstiness - 0.40) * 1.75
        else:
            score = burstiness * 1.0  # 0-0.40 maps to 0-0.40

        result = {
            "score": round(min(1.0, score), 3),
            "burstiness": round(burstiness, 3),
            "mean_sentence_length": round(mean_len, 1),
            "std_dev": round(std_dev, 1),
            "sentence_count": len(lengths),
        }

        if burstiness < 0.60:
            result["failure_reason"] = f"Sentence rhythm too uniform (burstiness: {burstiness:.2f}, target: >0.60)"
            result["suggestion"] = (
                "Vary sentence length more aggressively. Mix very short declaratives "
                "(4-8 words) with longer explanatory sentences (20-30 words). "
                "Flat, medium-length sentences signal AI generation."
            )

        return result

    def _score_ai_isms(self, text: str) -> Dict:
        """
        Score absence of known AI-ism phrases.
        More violations = lower score.
        """
        text_lower = text.lower()
        found = []

        for phrase in self.AI_ISMS:
            if phrase.lower() in text_lower:
                found.append(phrase)

        word_count = len(text.split())
        # Normalize by document length (per 100 words)
        density = (len(found) / max(1, word_count)) * 100

        # 0 found = 1.0, each violation drops score
        if len(found) == 0:
            score = 1.0
        elif len(found) == 1:
            score = 0.75
        elif len(found) == 2:
            score = 0.55
        elif len(found) == 3:
            score = 0.40
        else:
            score = max(0.0, 0.40 - (len(found) - 3) * 0.10)

        result = {
            "score": round(score, 3),
            "violations_found": len(found),
            "flagged_phrases": found,
            "density_per_100_words": round(density, 2),
        }

        if found:
            result["failure_reason"] = f"AI-ism phrases detected: {', '.join(found[:3])}"
            result["suggestion"] = (
                f"Remove or rewrite sections containing: {', '.join(found[:5])}. "
                "These phrases appear at statistically elevated rates in LLM-generated text."
            )

        return result

    def _score_parallel_structure(self, text: str) -> Dict:
        """
        Score for over-use of parallel list structures.
        LLMs default to parallel bullet points with similar-length items.
        Humans use lists too, but with more structural variety.

        Looks for: bulleted lists where all items have similar length,
        sentences that start with the same word across multiple consecutive lines,
        triple+ repetitions of the same sentence-opening pattern.
        """
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # Check bullet list uniformity
        bullet_lines = [l for l in lines if l.startswith(("-", "*", "•", "·"))]
        bullet_score = 1.0
        uniformity_note = None

        if len(bullet_lines) >= 3:
            lengths = [len(l.split()) for l in bullet_lines]
            if lengths:
                mean_len = statistics.mean(lengths)
                std_dev = statistics.stdev(lengths) if len(lengths) > 1 else 0
                coefficient = std_dev / mean_len if mean_len > 0 else 0

                if coefficient < 0.15 and len(bullet_lines) >= 4:
                    bullet_score = 0.40
                    uniformity_note = (
                        f"{len(bullet_lines)} bullet items with very uniform length "
                        f"(CV: {coefficient:.2f}). LLMs produce highly uniform lists."
                    )
                elif coefficient < 0.25:
                    bullet_score = 0.65

        # Check repeated sentence openers
        openers = []
        for line in lines:
            words = line.split()
            if len(words) >= 3:
                openers.append(words[0].lower())

        opener_score = 1.0
        opener_note = None
        if len(openers) >= 3:
            from collections import Counter
            counts = Counter(openers)
            most_common_word, most_common_count = counts.most_common(1)[0]
            if most_common_count >= 4 and most_common_count / len(openers) > 0.40:
                opener_score = 0.50
                opener_note = (
                    f"'{most_common_word}' starts {most_common_count} of {len(openers)} "
                    "sentences. Repetitive sentence structure signals AI generation."
                )

        overall_score = min(bullet_score, opener_score)

        result = {
            "score": round(overall_score, 3),
            "bullet_uniformity_score": round(bullet_score, 3),
            "opener_repetition_score": round(opener_score, 3),
            "bullet_count": len(bullet_lines),
        }

        if uniformity_note:
            result["failure_reason"] = uniformity_note
        if opener_note:
            result["failure_reason"] = (result.get("failure_reason", "") + " " + opener_note).strip()
        if overall_score < 0.60:
            result["suggestion"] = (
                "Break parallel structure. Vary bullet item length substantially. "
                "Mix sentence openers. Add structural variety: short declarative, "
                "then longer explanatory, then specific example."
            )

        return result

    def _score_hedge_density(self, text: str) -> Dict:
        """
        Score the absence of hedging qualifiers.
        LLMs hedge more than humans writing in a confident professional voice.
        High hedge density = AI signal.
        """
        text_lower = text.lower()
        word_count = len(text.split())
        found = []

        for hedge in self.HEDGE_WORDS:
            pattern = r'\b' + re.escape(hedge) + r'\b'
            matches = re.findall(pattern, text_lower)
            found.extend(matches)

        density = (len(found) / max(1, word_count)) * 100

        # Per 100 words: 0-1 = excellent, 1-2 = acceptable, 2-3 = borderline, >3 = fail
        if density <= 1.0:
            score = 1.0
        elif density <= 2.0:
            score = 0.80
        elif density <= 3.0:
            score = 0.55
        elif density <= 4.0:
            score = 0.35
        else:
            score = 0.20

        result = {
            "score": round(score, 3),
            "hedge_count": len(found),
            "density_per_100_words": round(density, 2),
            "examples": list(set(found))[:5],
        }

        if score < 0.60:
            result["failure_reason"] = (
                f"High hedge density: {density:.1f} qualifiers per 100 words "
                f"(examples: {', '.join(list(set(found))[:3])})"
            )
            result["suggestion"] = (
                "Remove qualifying language. State claims directly. Replace "
                "'it may be worth considering X' with 'consider X'. "
                "Hedges soften copy into AI-flavored mush."
            )

        return result

    def _score_specificity(self, text: str) -> Dict:
        """
        Score for concrete specificity.
        LLMs make vague general claims; humans (and good copy) commit to specifics.

        Positive signals: numbers, model names, proper nouns, years, measurements
        Negative signals: vague quantity words without backing detail
        """
        # Positive specificity markers
        number_pattern = r'\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:mph|rpm|miles|km|years?|months?|hours?|%|lbs?|kg|sq\s*ft|PSI))?\b'
        numbers = re.findall(number_pattern, text, re.IGNORECASE)

        # Proper nouns (capitalized mid-sentence, rough proxy)
        proper_nouns = re.findall(r'(?<![.!?]\s)(?<!["\'])\b[A-Z][a-z]{2,}\b', text)
        # Filter common sentence-starters
        common_starters = {"The", "A", "An", "We", "Our", "Your", "This", "That", "If", "When", "As", "At", "By", "For", "In", "It", "On", "So", "To"}
        proper_nouns = [p for p in proper_nouns if p not in common_starters]

        # Vague quantity phrases (negative)
        vague_quantities = re.findall(
            r'\b(many|various|several|numerous|countless|a lot of|lots of|tons of|'
            r'a wide range of|a variety of|a number of|multiple)\b',
            text, re.IGNORECASE
        )

        word_count = max(1, len(text.split()))
        specificity_density = (len(numbers) + len(proper_nouns)) / (word_count / 100)
        vague_density = len(vague_quantities) / (word_count / 100)

        # Score: high specificity + low vagueness = high score
        if specificity_density >= 5 and vague_density <= 1:
            score = 1.0
        elif specificity_density >= 3 and vague_density <= 2:
            score = 0.80
        elif specificity_density >= 2 or (specificity_density >= 1 and vague_density <= 1):
            score = 0.65
        elif specificity_density >= 1:
            score = 0.50
        else:
            score = 0.30

        # Penalize for vague density regardless
        if vague_density > 3:
            score = max(0.20, score - 0.30)
        elif vague_density > 2:
            score = max(0.30, score - 0.15)

        result = {
            "score": round(score, 3),
            "numbers_found": len(numbers),
            "proper_nouns_found": len(proper_nouns),
            "vague_quantity_words": len(vague_quantities),
            "specificity_density": round(specificity_density, 2),
        }

        if score < 0.60:
            result["failure_reason"] = (
                f"Copy lacks specificity (specificity density: {specificity_density:.1f}/100 words, "
                f"vague terms: {len(vague_quantities)})"
            )
            result["suggestion"] = (
                "Add concrete details: specific numbers, model names, years, measurements. "
                "Replace 'many years of experience' with '18 years'. "
                "Replace 'a wide range of services' with the actual service names."
            )

        return result

    def _score_transition_tells(self, text: str) -> Dict:
        """
        Score for overuse of formal transition words that LLMs favor.
        """
        text_lower = text.lower()
        word_count = max(1, len(text.split()))
        found = []

        for transition in self.FORMAL_TRANSITIONS:
            pattern = r'\b' + re.escape(transition) + r'\b'
            matches = re.findall(pattern, text_lower)
            if matches:
                found.append((transition, len(matches)))

        total_transitions = sum(count for _, count in found)
        density = (total_transitions / word_count) * 100

        if density <= 0.5:
            score = 1.0
        elif density <= 1.0:
            score = 0.80
        elif density <= 2.0:
            score = 0.60
        elif density <= 3.0:
            score = 0.40
        else:
            score = 0.20

        result = {
            "score": round(score, 3),
            "transition_count": total_transitions,
            "density_per_100_words": round(density, 2),
            "examples": [phrase for phrase, _ in found[:4]],
        }

        if score < 0.60:
            result["failure_reason"] = (
                f"Overuse of formal transitions: {', '.join([p for p, _ in found[:3]])} "
                f"({density:.1f} per 100 words)"
            )
            result["suggestion"] = (
                "Remove formal transitions. Let ideas connect naturally without 'Furthermore,' "
                "'Moreover,' 'In conclusion.' These words are AI tells. "
                "Use em-free direct connection or start a new sentence."
            )

        return result

    # ─── Utilities ───────────────────────────────────────────────────────────

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences. Handles abbreviations reasonably."""
        # Split on . ! ? followed by space and uppercase (rough but effective)
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z"])', text)
        return [s.strip() for s in sentences if s.strip() and len(s.split()) >= 2]

    def _empty_result(self, section_name: str) -> Dict:
        return {
            "section": section_name,
            "pass": True,
            "overall_score": 1.0,
            "note": "Empty section — skipped",
            "dimensions": {},
            "failures": [],
            "suggestions": [],
        }


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python pass1_ai_detection.py <file.txt> [--json]")
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        content = f.read()

    detector = AIDetector()
    result = detector.analyze_section(content, section_name="document")

    if "--json" in sys.argv:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n PASS 1 — AI DETECTION")
        print("=" * 60)
        print(f"Result: {'PASS' if result['pass'] else 'FAIL'}")
        print(f"Score:  {result['overall_score']:.0%} (threshold: {result['threshold']:.0%})")
        print()
        for dim, data in result["dimensions"].items():
            icon = "" if data["score"] >= 0.65 else ""
            print(f"  {icon} {dim}: {data['score']:.0%}")
        if result["failures"]:
            print(f"\nFailures:")
            for f in result["failures"]:
                print(f"  - {f}")
        if result["suggestions"]:
            print(f"\nSuggestions:")
            for s in result["suggestions"]:
                print(f"  - {s}")
