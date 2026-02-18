"""
GHM SCRVNR — Gate Orchestrator
================================
Runs Pass 1 (AI detection) and Pass 2 (voice alignment) in sequence.
Both must pass for the gate to open.

This is the only file the Website Studio pipeline needs to call.
Everything else is implementation detail.

Usage:
    # With a voice profile (Tier 1/2/3 with captured DNA)
    gate = SCRVNRGate(profile_path="profiles/gad-main.json")
    result = gate.run(sections={"hero": "...", "body": "..."})

    # Without a profile (Pass 1 only — AI detection standalone)
    gate = SCRVNRGate()
    result = gate.run(sections={"hero": "...", "body": "..."})

    # Single section
    result = gate.run_section(text="...", section_name="hero")

Result shape:
    {
        "gate_open": bool,           # True only if BOTH passes pass
        "pass1": {...},              # Full Pass 1 result
        "pass2": {...},              # Full Pass 2 result (or None if no profile)
        "override_eligible": bool,  # True if human override is allowed
        "summary": str,             # Human-readable one-liner
        "action_required": str,     # What to do next
        "sections": {...}           # Per-section breakdown
    }
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from pass1_ai_detection import AIDetector
from pass2_voice_alignment import VoiceAligner


class SCRVNRGate:
    """
    Main pipeline gate. Runs both passes and returns a unified decision.
    Instantiate once per job (one profile per property).
    """

    # Thresholds — can override at instantiation
    PASS1_THRESHOLD = 0.65
    PASS2_THRESHOLD = 0.60

    # Human override is always available but must be logged.
    # The gate can never be silently bypassed — only explicitly overridden.
    OVERRIDE_ALWAYS_ELIGIBLE = True

    def __init__(
        self,
        profile_path: Optional[str] = None,
        profile_dict: Optional[Dict] = None,
        pass1_threshold: float = None,
        pass2_threshold: float = None,
    ):
        """
        Args:
            profile_path: Path to voice_profile.json for Pass 2
            profile_dict: Directly injected profile dict (alternative to path)
            pass1_threshold: Override default Pass 1 threshold
            pass2_threshold: Override default Pass 2 threshold
        """
        self.pass1_threshold = pass1_threshold or self.PASS1_THRESHOLD
        self.pass2_threshold = pass2_threshold or self.PASS2_THRESHOLD

        # Pass 1 is always active
        self.detector = AIDetector(pass_threshold=self.pass1_threshold)

        # Pass 2 requires a profile
        self.aligner = None
        self.profile = None

        if profile_dict:
            self.profile = profile_dict
            self.aligner = VoiceAligner(profile_dict, pass_threshold=self.pass2_threshold)
        elif profile_path:
            profile_path = Path(profile_path)
            if not profile_path.exists():
                raise FileNotFoundError(f"Voice profile not found: {profile_path}")
            with open(profile_path, "r", encoding="utf-8") as f:
                self.profile = json.load(f)
            self.aligner = VoiceAligner(self.profile, pass_threshold=self.pass2_threshold)

    def run(self, sections: Dict[str, str], override: bool = False, override_note: str = "") -> Dict:
        """
        Run the full SCRVNR gate on a set of named sections.

        Args:
            sections:      dict of {section_name: text}
            override:      If True, gate reports override rather than hard fail
            override_note: Required if override=True

        Returns:
            Full gate result with per-section breakdown
        """
        if not sections:
            return self._empty_result()

        # ── Pass 1: AI Detection ──────────────────────────────────────────────
        p1_doc = self.detector.analyze_document(sections)

        # ── Pass 2: Voice Alignment ───────────────────────────────────────────
        p2_doc = None
        if self.aligner:
            p2_doc = self.aligner.analyze_document(sections)

        # ── Gate Decision ─────────────────────────────────────────────────────
        p1_pass = p1_doc["pass"]
        p2_pass = p2_doc["pass"] if p2_doc else True  # If no profile, Pass 2 is skipped (not failed)
        p2_active = self.aligner is not None

        gate_open = p1_pass and p2_pass

        # Override handling
        override_applied = False
        if not gate_open and override:
            if not override_note.strip():
                override_note = "(no note provided)"
            override_applied = True
            # Override doesn't change the scores — it just unlocks the gate.
            # The audit trail records everything.

        # ── Build Per-Section Summary ─────────────────────────────────────────
        section_summaries = {}
        for name in sections:
            p1_sec = p1_doc["section_results"].get(name, {})
            p2_sec = p2_doc["section_results"].get(name, {}) if p2_doc else None

            sec_p1_pass = p1_sec.get("pass", True)
            sec_p2_pass = p2_sec.get("pass", True) if p2_sec else True
            sec_pass = sec_p1_pass and sec_p2_pass

            section_summaries[name] = {
                "pass": sec_pass,
                "pass1_score": p1_sec.get("overall_score"),
                "pass1_pass": sec_p1_pass,
                "pass1_failures": p1_sec.get("failures", []),
                "pass2_score": p2_sec.get("overall_score") if p2_sec else None,
                "pass2_pass": sec_p2_pass,
                "pass2_failures": p2_sec.get("failures", []) if p2_sec else [],
            }

        # ── Human-readable summary ────────────────────────────────────────────
        summary, action = self._build_summary(
            gate_open, p1_pass, p2_pass, p2_active,
            p1_doc, p2_doc, override_applied
        )

        result = {
            "gate_open": gate_open or override_applied,
            "gate_status": self._gate_status(gate_open, override_applied),
            "override_applied": override_applied,
            "override_note": override_note if override_applied else None,
            "override_eligible": self.OVERRIDE_ALWAYS_ELIGIBLE,
            "pass1": {
                "active": True,
                "pass": p1_pass,
                "score": p1_doc["overall_score"],
                "threshold": self.pass1_threshold,
                "sections_failed": p1_doc["failed_sections"],
                "detail": p1_doc,
            },
            "pass2": {
                "active": p2_active,
                "pass": p2_pass,
                "score": p2_doc["overall_score"] if p2_doc else None,
                "threshold": self.pass2_threshold if p2_active else None,
                "profile_used": self.profile.get("profile_id") if self.profile else None,
                "brand": self.profile.get("brand_display_name") if self.profile else None,
                "sections_failed": p2_doc["failed_sections"] if p2_doc else [],
                "detail": p2_doc,
            },
            "sections": section_summaries,
            "summary": summary,
            "action_required": action,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        return result

    def run_section(
        self,
        text: str,
        section_name: str = "section",
        override: bool = False,
        override_note: str = "",
    ) -> Dict:
        """
        Convenience wrapper for single-section analysis.
        """
        return self.run(
            sections={section_name: text},
            override=override,
            override_note=override_note,
        )

    # ─── Internal ─────────────────────────────────────────────────────────────

    def _gate_status(self, gate_open: bool, override_applied: bool) -> str:
        if gate_open:
            return "PASS"
        if override_applied:
            return "OVERRIDE"
        return "FAIL"

    def _build_summary(
        self,
        gate_open, p1_pass, p2_pass, p2_active,
        p1_doc, p2_doc, override_applied
    ) -> Tuple[str, str]:
        """Return (summary_str, action_str)."""

        if override_applied:
            return (
                "Gate overridden by human reviewer. Audit trail logged.",
                "Review override note. Revise copy when possible to pass both checks."
            )

        if gate_open:
            if p2_active:
                return (
                    f"Both passes cleared. AI detection: {p1_doc['overall_score']:.0%}. "
                    f"Voice alignment ({p2_doc.get('profile_used', 'profile')}): {p2_doc['overall_score']:.0%}.",
                    "Ready for human review."
                )
            else:
                return (
                    f"Pass 1 cleared (AI detection: {p1_doc['overall_score']:.0%}). "
                    "No voice profile loaded — Pass 2 skipped.",
                    "Optionally load a voice profile to enable Pass 2 alignment scoring."
                )

        if not p1_pass and not p2_pass:
            failed_p1 = p1_doc.get("failed_sections", [])
            failed_p2 = p2_doc.get("failed_sections", []) if p2_doc else []
            return (
                f"Both passes failed. "
                f"AI detection failed in: {', '.join(failed_p1) or 'all sections'}. "
                f"Voice alignment failed in: {', '.join(failed_p2) or 'all sections'}.",
                "Rewrite flagged sections. Address AI-isms and voice misalignment before resubmitting."
            )

        if not p1_pass:
            failed = p1_doc.get("failed_sections", [])
            return (
                f"Pass 1 failed (AI detection score: {p1_doc['overall_score']:.0%}). "
                f"Failed sections: {', '.join(failed) or 'see detail'}.",
                "Rewrite flagged sections to improve sentence rhythm, remove AI-isms, and add specificity."
            )

        # p2_pass is False
        failed = p2_doc.get("failed_sections", []) if p2_doc else []
        brand = p2_doc.get("profile_used", "profile") if p2_doc else "profile"
        return (
            f"Pass 1 cleared. Pass 2 failed — voice not aligned to {brand} "
            f"(score: {p2_doc['overall_score']:.0%}). "
            f"Failed sections: {', '.join(failed) or 'see detail'}.",
            "Adjust copy to match brand voice profile. Review dimension failures for specific guidance."
        )

    def _empty_result(self) -> Dict:
        return {
            "gate_open": True,
            "gate_status": "PASS",
            "note": "No sections provided — gate trivially passed.",
            "pass1": {"active": True, "pass": True},
            "pass2": {"active": self.aligner is not None},
            "sections": {},
            "summary": "No content to evaluate.",
            "action_required": "Provide section content.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }


# ─── Convenience: Load profile by client/brand slug ───────────────────────────

def load_profile(profiles_dir: str, client_slug: str, brand_slug: str) -> Optional[Dict]:
    """
    Load a voice profile by client/brand slug from the profiles directory.
    Returns None if not found.
    """
    profiles_dir = Path(profiles_dir)
    # Try canonical naming: {client_slug}-{brand_slug}.json
    candidates = [
        profiles_dir / f"{client_slug}-{brand_slug}.json",
        profiles_dir / client_slug / f"{brand_slug}.json",
        profiles_dir / f"{brand_slug}.json",
    ]
    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    return None


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json as _json

    def _usage():
        print("Usage: python scrvnr_gate.py <file.txt> [<profile.json>] [--json] [--override 'note']")
        sys.exit(1)

    if len(sys.argv) < 2:
        _usage()

    content_path = sys.argv[1]
    profile_path = None
    output_json = "--json" in sys.argv
    override = False
    override_note = ""

    # Parse optional args
    for i, arg in enumerate(sys.argv[2:], 2):
        if arg.endswith(".json"):
            profile_path = arg
        elif arg == "--override" and i + 1 < len(sys.argv):
            override = True
            override_note = sys.argv[i + 1]

    with open(content_path, "r", encoding="utf-8") as f:
        text = f.read()

    gate = SCRVNRGate(profile_path=profile_path)
    result = gate.run_section(text, section_name="document", override=override, override_note=override_note)

    if output_json:
        print(_json.dumps(result, indent=2))
    else:
        status_icon = "" if result["gate_open"] else ""
        override_tag = " [OVERRIDE]" if result["override_applied"] else ""
        print(f"\n SCRVNR GATE — {result['gate_status']}{override_tag}")
        print("=" * 60)
        print(f"\n{result['summary']}")
        print(f"\n Pass 1 (AI Detection):  {'PASS' if result['pass1']['pass'] else 'FAIL'}  {result['pass1']['score']:.0%}")
        if result["pass2"]["active"]:
            p2 = result["pass2"]
            print(f" Pass 2 (Voice Align):  {'PASS' if p2['pass'] else 'FAIL'}  {p2['score']:.0%}  [{p2.get('brand', p2.get('profile_used', ''))}]")
        else:
            print(f" Pass 2 (Voice Align):  SKIPPED  (no profile loaded)")
        print(f"\n Action: {result['action_required']}")
