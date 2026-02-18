"""
GHM Website Studio — SCRVNR Integration Adapter
=================================================
The bridge between Website Studio's content pipeline and the SCRVNR gate.

This is the ONLY file Website Studio should touch.
Everything below this adapter is SCRVNR internals.

Adapter responsibilities:
  - Load the correct profile for the property being worked on
  - Normalize Website Studio section data into SCRVNR input format
  - Return a Website Studio-ready result structure
  - Handle missing profiles gracefully (Pass 1 only, with warning)
  - Provide section-level results for inline composer feedback
  - Log all gate decisions for audit trail

Usage in Website Studio pipeline:

    from scrvnr.website_studio_adapter import SCRVNRAdapter

    adapter = SCRVNRAdapter(profiles_dir="scrvnr/profiles")

    # On page submission to review queue:
    result = adapter.check_page(
        property_slug="gad-main",
        sections={
            "hero": "Don't pay high dealer prices...",
            "services": "The German Auto Doctor started as a Performance shop...",
            "cta": "Schedule your appointment today."
        }
    )

    if result["gate_open"]:
        # Queue for human review
        pass
    else:
        # Return to composer with failures
        return result["composer_feedback"]

    # Human override:
    result = adapter.check_page(
        property_slug="gad-main",
        sections=sections,
        override=True,
        override_note="Client approved via email 2026-02-18"
    )
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Add scrvnr core to path
_scrvnr_root = Path(__file__).parent
sys.path.insert(0, str(_scrvnr_root / "core"))

from scrvnr_gate import SCRVNRGate, load_profile


# ── Profile registry cache ────────────────────────────────────────────────────
# Profiles are loaded once per adapter instance and cached.
# Instantiate one adapter per server process, not per request.

class SCRVNRAdapter:
    """
    Website Studio → SCRVNR bridge.
    One instance per application server. Profiles cached after first load.
    """

    def __init__(
        self,
        profiles_dir: str = None,
        pass1_threshold: float = 0.65,
        pass2_threshold: float = 0.60,
    ):
        self.profiles_dir = Path(profiles_dir or (_scrvnr_root / "profiles"))
        self.pass1_threshold = pass1_threshold
        self.pass2_threshold = pass2_threshold
        self._profile_cache: Dict[str, Optional[Dict]] = {}
        self._gate_cache: Dict[str, SCRVNRGate] = {}

    def check_page(
        self,
        property_slug: str,
        sections: Dict[str, str],
        override: bool = False,
        override_note: str = "",
        job_id: str = None,
    ) -> Dict:
        """
        Run the SCRVNR gate on a full page of sections.

        Args:
            property_slug: Profile identifier (e.g. "gad-main"). Must match
                           a profile filename in profiles_dir.
            sections:      Dict of {section_name: text}. Section names should
                           match Website Studio section identifiers.
            override:      Human override flag. Requires override_note.
            override_note: Reason for override. Required if override=True.
            job_id:        Optional job/page ID for audit logging.

        Returns:
            Website Studio-ready result dict (see _build_ws_result)
        """
        if override and not override_note.strip():
            return self._error_result("Override requires a note. Provide override_note.")

        # Filter empty sections
        active_sections = {k: v for k, v in sections.items() if v and v.strip()}
        if not active_sections:
            return self._error_result("No content provided in sections.")

        gate = self._get_gate(property_slug)
        raw = gate.run(
            sections=active_sections,
            override=override,
            override_note=override_note,
        )

        return self._build_ws_result(raw, property_slug, job_id)

    def check_section(
        self,
        property_slug: str,
        section_name: str,
        text: str,
        override: bool = False,
        override_note: str = "",
    ) -> Dict:
        """
        Run the SCRVNR gate on a single section.
        Used for live inline feedback in the Page Composer.
        Lightweight — returns only what the composer UI needs.
        """
        if not text or not text.strip():
            return {"gate_open": True, "skipped": True, "reason": "Empty section"}

        gate = self._get_gate(property_slug)
        raw = gate.run_section(
            text=text.strip(),
            section_name=section_name,
            override=override,
            override_note=override_note,
        )

        return self._build_ws_section_result(raw, section_name)

    def get_profile_summary(self, property_slug: str) -> Dict:
        """
        Return a human-readable summary of the loaded voice profile.
        Used by Website Studio to show "Voice DNA" in the property settings panel.
        """
        profile = self._load_profile(property_slug)
        if not profile:
            return {
                "loaded": False,
                "property_slug": property_slug,
                "message": f"No voice profile found for '{property_slug}'. Pass 1 only (AI detection). Load a profile to enable voice alignment.",
            }

        cr = profile.get("contraction_rate", {})
        sr = profile.get("sentence_rhythm", {})
        rl = profile.get("reading_level", {})
        reg = profile.get("register", {})
        ts = profile.get("technical_specificity", {})
        nc = profile.get("native_constructions", {})
        ns = profile.get("negative_space", {})
        cc = profile.get("capture_confidence", {})

        return {
            "loaded": True,
            "property_slug": property_slug,
            "profile_id": profile.get("profile_id"),
            "brand": profile.get("brand_display_name"),
            "source_url": profile.get("source_url"),
            "capture_confidence": cc.get("overall"),
            "source_word_count": cc.get("source_word_count"),
            "dna": {
                "reading_level_grade": rl.get("flesch_kincaid_grade"),
                "burstiness": sr.get("burstiness_score"),
                "contraction_rate": cr.get("measured"),
                "specificity": ts.get("level"),
                "formality": reg.get("formality_score"),
                "warmth": reg.get("warmth_score"),
                "primary_person": reg.get("primary_person"),
                "trust_pattern": profile.get("trust_signal_pattern", {}).get("type"),
                "native_constructions_count": len(nc.get("items", [])),
                "negative_space_count": len(ns.get("items", [])),
            },
        }

    def list_profiles(self) -> List[str]:
        """Return list of available profile slugs."""
        return [
            p.stem for p in self.profiles_dir.glob("*.json")
            if p.is_file()
        ]

    # ── Internal ──────────────────────────────────────────────────────────────

    def _get_gate(self, property_slug: str) -> SCRVNRGate:
        """Load (or return cached) gate for this property slug."""
        if property_slug not in self._gate_cache:
            profile = self._load_profile(property_slug)
            self._gate_cache[property_slug] = SCRVNRGate(
                profile_dict=profile,
                pass1_threshold=self.pass1_threshold,
                pass2_threshold=self.pass2_threshold,
            )
        return self._gate_cache[property_slug]

    def _load_profile(self, property_slug: str) -> Optional[Dict]:
        """Load (or return cached) profile. Returns None if not found."""
        if property_slug not in self._profile_cache:
            profile = load_profile(
                profiles_dir=str(self.profiles_dir),
                client_slug=property_slug.rsplit("-", 1)[0] if "-" in property_slug else property_slug,
                brand_slug=property_slug.rsplit("-", 1)[1] if "-" in property_slug else "main",
            )
            # Also try direct filename match
            if not profile:
                direct = self.profiles_dir / f"{property_slug}.json"
                if direct.exists():
                    with open(direct) as f:
                        profile = json.load(f)
            self._profile_cache[property_slug] = profile
        return self._profile_cache[property_slug]

    def _build_ws_result(self, raw: Dict, property_slug: str, job_id: str) -> Dict:
        """
        Transform raw gate result into Website Studio pipeline format.

        Website Studio consumes:
          gate_open          — bool, determines pipeline progression
          gate_status        — "PASS" | "FAIL" | "OVERRIDE"
          override_applied   — bool
          profile_loaded     — bool (was a voice profile available?)
          pass1_score        — float
          pass2_score        — float or None
          summary            — human-readable one-liner for status bar
          action_required    — guidance copy for composer prompt
          sections           — per-section results for inline feedback
          composer_feedback  — structured feedback list for UI rendering
          audit              — full raw result for audit trail storage
        """
        profile_loaded = raw["pass2"]["active"]
        section_results = raw.get("sections", {})

        # Build composer feedback list (sorted: failed first)
        feedback = []
        for name, sec in section_results.items():
            entry = {
                "section": name,
                "pass": sec["pass"],
                "pass1_score": sec.get("pass1_score"),
                "pass2_score": sec.get("pass2_score"),
                "failures": sec.get("pass1_failures", []) + sec.get("pass2_failures", []),
            }
            feedback.append(entry)
        feedback.sort(key=lambda x: (x["pass"], -(x.get("pass1_score") or 0)))

        return {
            "gate_open": raw["gate_open"],
            "gate_status": raw["gate_status"],
            "override_applied": raw.get("override_applied", False),
            "override_note": raw.get("override_note"),
            "profile_loaded": profile_loaded,
            "profile_id": raw["pass2"].get("profile_used"),
            "brand": raw["pass2"].get("brand"),
            "pass1_score": raw["pass1"]["score"],
            "pass1_pass": raw["pass1"]["pass"],
            "pass2_score": raw["pass2"]["score"],
            "pass2_pass": raw["pass2"]["pass"],
            "summary": raw["summary"],
            "action_required": raw["action_required"],
            "sections": section_results,
            "composer_feedback": feedback,
            "job_id": job_id,
            "timestamp": raw["timestamp"],
            "audit": raw,  # Full raw result for audit trail
        }

    def _build_ws_section_result(self, raw: Dict, section_name: str) -> Dict:
        """
        Lightweight single-section result for live composer feedback.
        Only what the inline indicator needs to render.
        """
        sec = raw.get("sections", {}).get(section_name, {})
        p1 = raw["pass1"]
        p2 = raw["pass2"]

        all_failures = (
            sec.get("pass1_failures", []) + sec.get("pass2_failures", [])
        )

        return {
            "section": section_name,
            "gate_open": raw["gate_open"],
            "gate_status": raw["gate_status"],
            "pass1_score": p1.get("score"),
            "pass1_pass": p1.get("pass"),
            "pass2_score": p2.get("score"),
            "pass2_pass": p2.get("pass"),
            "profile_loaded": p2.get("active"),
            "failures": all_failures,
            "action": raw.get("action_required"),
            "timestamp": raw.get("timestamp"),
        }

    def _error_result(self, message: str) -> Dict:
        return {
            "gate_open": False,
            "gate_status": "ERROR",
            "error": message,
            "composer_feedback": [{"section": "all", "pass": False, "failures": [message]}],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }


# ── Module-level convenience instance ────────────────────────────────────────
# Import and use this directly for simple cases:
#   from scrvnr.website_studio_adapter import default_adapter
#   result = default_adapter.check_page("gad-main", sections)

_default_profiles_dir = Path(__file__).parent / "profiles"
default_adapter = SCRVNRAdapter(profiles_dir=str(_default_profiles_dir))
