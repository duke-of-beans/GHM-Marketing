"""
GHM SCRVNR — Pass 2: Voice Alignment
======================================
Compares copy against a loaded voice profile to score how well it
matches the captured brand voice. No LLM required.

Unlike Pass 1 (which is universal), Pass 2 is profile-driven —
it uses the specific metrics captured in the client's voice_profile.json
to score alignment. Every client/brand gets their own scoring baseline.

Scoring dimensions:
  1. Reading level alignment     — FK grade vs. profile target
  2. Sentence rhythm alignment   — burstiness vs. profile burstiness
  3. Contraction rate alignment  — measured vs. profile target
  4. Specificity alignment       — level vs. profile specificity level
  5. Register alignment          — formality/warmth match
  6. Native construction hit     — how many profile patterns appear
  7. Negative space violation    — presence of "never say" patterns

Each dimension scores 0.0–1.0.
Overall Pass 2 score = weighted composite.
Threshold for pass: configurable, default 0.60.

Usage:
    profile = json.load(open("profiles/gad-main.json"))
    aligner = VoiceAligner(profile)
    result = aligner.analyze_section(text, section_name="hero")
"""

import re
import math
import json
import statistics
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class VoiceAligner:
    """
    Pass 2 engine: Voice alignment against a captured brand profile.
    Profile-driven — different clients, different baselines.
    """

    PASS_THRESHOLD = 0.60

    def __init__(self, profile: Dict, pass_threshold: float = None):
        """
        Args:
            profile: Loaded voice profile dict (from voice_profile_schema.json)
            pass_threshold: Override default pass threshold
        """
        self.profile = profile
        self.pass_threshold = pass_threshold or self.PASS_THRESHOLD

        # Pre-compile native construction patterns
        self._native_patterns = self._compile_patterns(
            profile.get("native_constructions", {}).get("items", [])
        )
        # Pre-compile negative space patterns
        self._negative_patterns = self._compile_patterns(
            profile.get("negative_space", {}).get("items", [])
        )

    def analyze_section(self, text: str, section_name: str = "section") -> Dict:
        """
        Analyze a single section against the voice profile.

        Returns per-section scoring with specific alignment failures.
        """
        text = text.strip()
        if not text:
            return self._empty_result(section_name)

        dimensions = {}

        # Reading level (if profile has target)
        rl = self.profile.get("reading_level", {})
        if rl.get("target_min") is not None or rl.get("target_max") is not None:
            dimensions["reading_level"] = self._score_reading_level(text, rl)

        # Sentence rhythm (burstiness)
        sr = self.profile.get("sentence_rhythm", {})
        if sr.get("burstiness_score") is not None:
            dimensions["sentence_rhythm"] = self._score_rhythm(text, sr)

        # Contraction rate
        cr = self.profile.get("contraction_rate", {})
        if cr.get("target_min") is not None or cr.get("measured") is not None:
            dimensions["contraction_rate"] = self._score_contractions(text, cr)

        # Specificity
        ts = self.profile.get("technical_specificity", {})
        if ts.get("target"):
            dimensions["specificity"] = self._score_specificity(text, ts)

        # Register (formality / warmth)
        reg = self.profile.get("register", {})
        if reg.get("formality_score") is not None:
            dimensions["register"] = self._score_register(text, reg)

        # Native constructions
        nc = self.profile.get("native_constructions", {})
        if nc.get("items"):
            dimensions["native_constructions"] = self._score_native_constructions(text, nc)

        # Negative space violations
        ns = self.profile.get("negative_space", {})
        if ns.get("items"):
            dimensions["negative_space"] = self._score_negative_space(text, ns)

        # If profile is sparse (new/incomplete), score leniently
        if not dimensions:
            return self._sparse_profile_result(section_name)

        # Weights — native constructions and contraction rate are highest signal
        weights = {
            "reading_level": 0.15,
            "sentence_rhythm": 0.15,
            "contraction_rate": 0.20,
            "specificity": 0.10,
            "register": 0.10,
            "native_constructions": 0.20,
            "negative_space": 0.10,
        }

        # Normalize weights to what's actually scored
        active_weights = {k: v for k, v in weights.items() if k in dimensions}
        total_weight = sum(active_weights.values())
        if total_weight == 0:
            total_weight = 1.0

        overall_score = sum(
            dimensions[dim]["score"] * (active_weights[dim] / total_weight)
            for dim in dimensions
        )

        failures = []
        suggestions = []
        for dim, result in dimensions.items():
            if result["score"] < 0.60:
                if result.get("failure_reason"):
                    failures.append(result["failure_reason"])
                if result.get("suggestion"):
                    suggestions.append(result["suggestion"])

        profile_id = self.profile.get("profile_id", "unknown")
        brand = self.profile.get("brand_display_name", "")

        return {
            "section": section_name,
            "profile_used": profile_id,
            "brand": brand,
            "pass": overall_score >= self.pass_threshold,
            "overall_score": round(overall_score, 3),
            "threshold": self.pass_threshold,
            "dimensions": dimensions,
            "failures": failures,
            "suggestions": suggestions,
        }

    def analyze_document(self, sections: Dict[str, str]) -> Dict:
        """
        Analyze multiple sections. Returns aggregate with per-section breakdown.
        """
        section_results = {}
        for name, text in sections.items():
            section_results[name] = self.analyze_section(text, name)

        passed = [k for k, v in section_results.items() if v["pass"]]
        failed = [k for k, v in section_results.items() if not v["pass"]]
        scores = [v["overall_score"] for v in section_results.values()]
        overall = statistics.mean(scores) if scores else 0.0

        return {
            "profile_used": self.profile.get("profile_id", "unknown"),
            "pass": len(failed) == 0,
            "overall_score": round(overall, 3),
            "sections_passed": len(passed),
            "sections_failed": len(failed),
            "section_results": section_results,
            "failed_sections": failed,
        }

    # ─── Dimension Scorers ───────────────────────────────────────────────────

    def _score_reading_level(self, text: str, profile_rl: Dict) -> Dict:
        """
        Score reading level alignment using Flesch-Kincaid approximation.
        """
        fk = self._estimate_fk_grade(text)
        target_min = profile_rl.get("target_min")
        target_max = profile_rl.get("target_max")
        tolerance = profile_rl.get("tolerance", 1.5)

        # If only measured (no explicit target range), derive range from measured
        if target_min is None and target_max is None:
            measured_profile = profile_rl.get("flesch_kincaid_grade")
            if measured_profile:
                target_min = measured_profile - tolerance
                target_max = measured_profile + tolerance
            else:
                return {"score": 0.80, "note": "No reading level target in profile"}

        # Score by distance from acceptable range
        if target_min <= fk <= target_max:
            score = 1.0
        elif fk < target_min:
            distance = target_min - fk
            score = max(0.0, 1.0 - (distance / tolerance))
        else:
            distance = fk - target_max
            score = max(0.0, 1.0 - (distance / tolerance))

        result = {
            "score": round(score, 3),
            "measured_grade": round(fk, 1),
            "target_min": target_min,
            "target_max": target_max,
        }

        if score < 0.60:
            direction = "too complex" if fk > target_max else "too simple"
            result["failure_reason"] = (
                f"Reading level {direction} (grade {fk:.1f}, target: {target_min}-{target_max})"
            )
            result["suggestion"] = (
                f"{'Simplify sentence structure and vocabulary' if fk > target_max else 'Add more technical detail and complexity'} "
                f"to reach target reading level {target_min:.0f}-{target_max:.0f}."
            )

        return result

    def _score_rhythm(self, text: str, profile_sr: Dict) -> Dict:
        """
        Score sentence rhythm (burstiness) alignment against profile.
        """
        target_burstiness = profile_sr.get("burstiness_score")
        tolerance = 0.15  # Allow ±0.15 variance from profile

        sentences = self._split_sentences(text)
        if len(sentences) < 3:
            return {"score": 0.75, "note": "Too few sentences to score rhythm"}

        lengths = [len(s.split()) for s in sentences if s.strip()]
        if len(lengths) < 2:
            return {"score": 0.75, "note": "Insufficient sentence data"}

        mean_len = statistics.mean(lengths)
        std_dev = statistics.stdev(lengths)
        measured_burstiness = std_dev / mean_len if mean_len > 0 else 0

        distance = abs(measured_burstiness - target_burstiness)
        score = max(0.0, 1.0 - (distance / (tolerance * 2)))

        result = {
            "score": round(score, 3),
            "measured_burstiness": round(measured_burstiness, 3),
            "target_burstiness": target_burstiness,
            "distance": round(distance, 3),
        }

        if score < 0.60:
            direction = "too varied" if measured_burstiness > target_burstiness else "too uniform"
            result["failure_reason"] = (
                f"Sentence rhythm {direction} (measured: {measured_burstiness:.2f}, "
                f"profile target: {target_burstiness:.2f})"
            )
            result["suggestion"] = (
                f"This brand voice has burstiness {target_burstiness:.2f}. "
                f"{'Reduce extreme sentence length variation' if measured_burstiness > target_burstiness else 'Add more variety in sentence length'}."
            )

        return result

    def _score_contractions(self, text: str, profile_cr: Dict) -> Dict:
        """
        Score contraction rate alignment against profile target.
        """
        target = profile_cr.get("target_min") or profile_cr.get("measured")
        target_max = profile_cr.get("target_max")
        tolerance = profile_cr.get("tolerance", 0.10)

        if target is None:
            return {"score": 0.80, "note": "No contraction target in profile"}

        measured = self._measure_contraction_rate(text)

        if target_max and measured <= target_max and measured >= target:
            score = 1.0
        else:
            distance = abs(measured - target)
            score = max(0.0, 1.0 - (distance / (tolerance * 2)))

        result = {
            "score": round(score, 3),
            "measured": round(measured, 3),
            "target": target,
            "tolerance": tolerance,
        }

        if score < 0.60:
            direction = "too formal" if measured < target else "too casual"
            result["failure_reason"] = (
                f"Contraction rate {direction} ({measured:.0%} vs. profile target {target:.0%})"
            )
            result["suggestion"] = (
                f"{'Add contractions' if measured < target else 'Reduce contractions'} "
                f"to match brand voice (target: {target:.0%})."
            )

        return result

    def _score_specificity(self, text: str, profile_ts: Dict) -> Dict:
        """
        Score specificity level alignment.
        Levels: low | moderate | high | very-high
        """
        target_level = profile_ts.get("target", "moderate")
        level_map = {"low": 1, "moderate": 2, "high": 3, "very-high": 4}
        target_numeric = level_map.get(target_level, 2)

        # Measure specificity from text
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        proper_nouns = re.findall(
            r'(?<![.!?]\s)\b[A-Z][a-z]{2,}\b', text
        )
        model_names = re.findall(r'\b[A-Z][0-9]+\b|\b[A-Z]{2,}[0-9]+\b', text)
        word_count = max(1, len(text.split()))

        specificity_density = (len(numbers) + len(proper_nouns) + len(model_names) * 2) / (word_count / 100)

        if specificity_density >= 8:
            measured_numeric = 4
            measured_level = "very-high"
        elif specificity_density >= 5:
            measured_numeric = 3
            measured_level = "high"
        elif specificity_density >= 2:
            measured_numeric = 2
            measured_level = "moderate"
        else:
            measured_numeric = 1
            measured_level = "low"

        distance = abs(measured_numeric - target_numeric)
        score = max(0.0, 1.0 - distance * 0.33)

        result = {
            "score": round(score, 3),
            "measured_level": measured_level,
            "target_level": target_level,
            "specificity_density": round(specificity_density, 2),
        }

        if score < 0.60:
            direction = "too vague" if measured_numeric < target_numeric else "too technical"
            result["failure_reason"] = (
                f"Specificity {direction} (measured: {measured_level}, profile target: {target_level})"
            )
            result["suggestion"] = (
                f"This brand voice commits to {target_level} specificity. "
                f"{'Add specific numbers, model names, and technical details' if measured_numeric < target_numeric else 'Reduce technical jargon for broader accessibility'}."
            )

        return result

    def _score_register(self, text: str, profile_reg: Dict) -> Dict:
        """
        Score formality and warmth register alignment.
        """
        target_formality = profile_reg.get("formality_score")
        target_warmth = profile_reg.get("warmth_score")

        if target_formality is None and target_warmth is None:
            return {"score": 0.80, "note": "No register targets in profile"}

        scores = []

        # Formality estimation
        if target_formality is not None:
            formal_markers = ["however", "therefore", "furthermore", "regarding", "pursuant"]
            casual_markers = ["it's", "you'll", "gonna", "don't", "won't", "can't", "here's"]
            text_lower = text.lower()
            formal_count = sum(1 for w in formal_markers if w in text_lower)
            casual_count = sum(1 for w in casual_markers if w in text_lower)

            if casual_count > formal_count:
                estimated_formality = max(1, 5 - (casual_count - formal_count))
            else:
                estimated_formality = min(10, 5 + (formal_count - casual_count))

            formality_distance = abs(estimated_formality - target_formality)
            formality_score = max(0.0, 1.0 - formality_distance / 5.0)
            scores.append(formality_score)

        # Warmth estimation (second-person usage, direct address, inclusive language)
        if target_warmth is not None:
            warm_markers = ["you", "your", "we", "our", "together", "help", "care"]
            cold_markers = ["the client", "the customer", "users", "end users", "personnel"]
            text_lower = text.lower()
            warm_count = sum(1 for w in warm_markers if w in text_lower)
            cold_count = sum(1 for w in cold_markers if w in text_lower)

            if warm_count > cold_count:
                estimated_warmth = min(10, 5 + (warm_count - cold_count))
            else:
                estimated_warmth = max(1, 5 - (cold_count - warm_count))

            warmth_distance = abs(estimated_warmth - target_warmth)
            warmth_score = max(0.0, 1.0 - warmth_distance / 5.0)
            scores.append(warmth_score)

        overall_score = statistics.mean(scores) if scores else 0.80

        result = {
            "score": round(overall_score, 3),
        }
        if target_formality is not None:
            result["formality_estimated"] = estimated_formality
            result["formality_target"] = target_formality
        if target_warmth is not None:
            result["warmth_estimated"] = estimated_warmth
            result["warmth_target"] = target_warmth

        if overall_score < 0.60:
            result["failure_reason"] = "Register (formality/warmth) doesn't match brand voice"
            result["suggestion"] = (
                f"Adjust tone toward profile targets: "
                f"formality {target_formality}/10, warmth {target_warmth}/10."
            )

        return result

    def _score_native_constructions(self, text: str, profile_nc: Dict) -> Dict:
        """
        Score presence of native voice constructions from profile.
        These are phrases and structures characteristic of this specific brand.
        """
        items = profile_nc.get("items", [])
        if not items:
            return {"score": 0.80, "note": "No native constructions defined in profile"}

        confidence_threshold = profile_nc.get("confidence_threshold", 0.70)
        text_lower = text.lower()

        found = []
        missed = []
        for item in items:
            pattern_text = item if isinstance(item, str) else item.get("pattern", "")
            confidence = 1.0 if isinstance(item, str) else item.get("confidence", 1.0)

            if confidence >= confidence_threshold:
                if pattern_text.lower() in text_lower:
                    found.append(pattern_text)
                else:
                    missed.append(pattern_text)

        total_high_confidence = len(found) + len(missed)
        if total_high_confidence == 0:
            return {"score": 0.80, "note": "No high-confidence constructions to match"}

        hit_rate = len(found) / total_high_confidence

        # Scoring: not every section will use every pattern.
        # Expect 15-30% hit rate as baseline good performance.
        if hit_rate >= 0.30:
            score = 1.0
        elif hit_rate >= 0.20:
            score = 0.85
        elif hit_rate >= 0.10:
            score = 0.70
        elif hit_rate >= 0.05:
            score = 0.55
        else:
            score = 0.40

        result = {
            "score": round(score, 3),
            "patterns_found": len(found),
            "patterns_checked": total_high_confidence,
            "hit_rate": round(hit_rate, 3),
            "found_examples": found[:3],
            "missed_examples": missed[:3],
        }

        if score < 0.60 and len(found) == 0:
            result["failure_reason"] = (
                f"No native brand constructions detected (0/{total_high_confidence} patterns matched)"
            )
            result["suggestion"] = (
                f"This brand voice uses characteristic patterns. Consider: "
                f"{', '.join(missed[:3])}"
            )

        return result

    def _score_negative_space(self, text: str, profile_ns: Dict) -> Dict:
        """
        Score absence of patterns this brand voice never uses.
        Finding a negative space pattern is a hard fail signal.
        """
        items = profile_ns.get("items", [])
        if not items:
            return {"score": 1.0, "note": "No negative space defined — skipped"}

        text_lower = text.lower()
        violations = []

        for item in items:
            pattern_text = item if isinstance(item, str) else item.get("pattern", "")
            if pattern_text.lower() in text_lower:
                violations.append(pattern_text)

        if len(violations) == 0:
            score = 1.0
        elif len(violations) == 1:
            score = 0.50
        else:
            score = 0.20

        result = {
            "score": round(score, 3),
            "violations": violations,
            "violation_count": len(violations),
        }

        if violations:
            result["failure_reason"] = (
                f"Negative space violations — brand would never say: {', '.join(violations[:3])}"
            )
            result["suggestion"] = (
                f"Remove or rewrite sections containing: {', '.join(violations)}. "
                "These patterns are explicitly out of character for this brand voice."
            )

        return result

    # ─── Utilities ───────────────────────────────────────────────────────────

    def _estimate_fk_grade(self, text: str) -> float:
        """
        Estimate Flesch-Kincaid grade level.
        FK Grade = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
        Syllable count approximated by vowel-cluster counting.
        """
        sentences = self._split_sentences(text)
        if not sentences:
            return 8.0  # Default neutral

        words = text.split()
        if not words:
            return 8.0

        sentence_count = max(1, len(sentences))
        word_count = len(words)
        syllable_count = sum(self._estimate_syllables(w) for w in words)

        avg_sentence_length = word_count / sentence_count
        avg_syllables = syllable_count / word_count

        fk = 0.39 * avg_sentence_length + 11.8 * avg_syllables - 15.59
        return max(1.0, min(20.0, fk))

    def _estimate_syllables(self, word: str) -> int:
        """Rough syllable count via vowel cluster counting."""
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
        # Silent e at end
        if word.endswith("e") and len(word) > 2:
            count = max(1, count - 1)
        return max(1, count)

    def _measure_contraction_rate(self, text: str) -> float:
        """Measure fraction of eligible positions where contractions appear."""
        contractions = [
            "it's", "you'll", "here's", "that's", "don't", "won't", "can't",
            "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
            "hadn't", "i'm", "you're", "we're", "they're", "i've", "we've",
            "they've", "i'd", "you'd", "we'd", "they'd", "what's", "where's",
            "when's", "who's", "how's", "there's", "let's", "didn't", "doesn't"
        ]
        text_lower = text.lower()
        count = sum(1 for c in contractions if c in text_lower)
        words = len(text.split())
        opportunities = max(1, words / 8)
        return min(1.0, count / opportunities)

    def _compile_patterns(self, items: List) -> List[str]:
        """Normalize pattern items to plain strings."""
        result = []
        for item in items:
            if isinstance(item, str):
                result.append(item.lower())
            elif isinstance(item, dict) and "pattern" in item:
                result.append(item["pattern"].lower())
        return result

    def _split_sentences(self, text: str) -> List[str]:
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

    def _sparse_profile_result(self, section_name: str) -> Dict:
        return {
            "section": section_name,
            "pass": True,
            "overall_score": 0.80,
            "note": "Profile incomplete — limited alignment scoring available. Complete DNA capture for full validation.",
            "dimensions": {},
            "failures": [],
            "suggestions": ["Complete voice profile capture to enable full alignment scoring."],
        }


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 3:
        print("Usage: python pass2_voice_alignment.py <file.txt> <profile.json> [--json]")
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        content = f.read()

    with open(sys.argv[2], "r", encoding="utf-8") as f:
        profile = json.load(f)

    aligner = VoiceAligner(profile)
    result = aligner.analyze_section(content, section_name="document")

    if "--json" in sys.argv:
        print(json.dumps(result, indent=2))
    else:
        brand = result.get("brand") or result.get("profile_used", "unknown")
        print(f"\n PASS 2 — VOICE ALIGNMENT ({brand})")
        print("=" * 60)
        print(f"Result: {'PASS' if result['pass'] else 'FAIL'}")
        print(f"Score:  {result['overall_score']:.0%} (threshold: {result['threshold']:.0%})")
        print()
        for dim, data in result.get("dimensions", {}).items():
            icon = "" if data["score"] >= 0.60 else ""
            print(f"  {icon} {dim}: {data['score']:.0%}")
        if result["failures"]:
            print(f"\nFailures:")
            for f in result["failures"]:
                print(f"  - {f}")
        if result["suggestions"]:
            print(f"\nSuggestions:")
            for s in result["suggestions"]:
                print(f"  - {s}")
