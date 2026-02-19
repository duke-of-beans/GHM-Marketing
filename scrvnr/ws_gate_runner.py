"""
ws_gate_runner.py — Website Studio SCRVNR subprocess entry point
=================================================================
Accepts JSON on stdin, writes result JSON to stdout.
Called by the Next.js SCRVNR API route via child_process.spawn.

Input JSON schema:
  {
    "property_slug": str,
    "sections": { sectionName: str, ... },
    "section_only": str | null,   # If set, run check_section instead of check_page
    "override": bool,
    "override_note": str,
    "job_id": str | null
  }

Output: JSON matching ScrvnrAdapterResult TypeScript type.
"""

import sys
import json

def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        error_out(f"Invalid JSON input: {e}")
        return

    property_slug = payload.get("property_slug", "no-profile")
    sections      = payload.get("sections", {})
    section_only  = payload.get("section_only")
    override      = payload.get("override", False)
    override_note = payload.get("override_note", "")
    job_id        = payload.get("job_id")

    try:
        from website_studio_adapter import SCRVNRAdapter
        import os

        profiles_dir = os.path.join(os.path.dirname(__file__), "profiles")
        adapter = SCRVNRAdapter(profiles_dir=profiles_dir)

        if section_only:
            result = adapter.check_section(
                property_slug=property_slug,
                section_name=section_only,
                text=sections.get(section_only, ""),
                override=override,
                override_note=override_note,
            )
        else:
            result = adapter.check_page(
                property_slug=property_slug,
                sections=sections,
                override=override,
                override_note=override_note,
                job_id=job_id,
            )

        print(json.dumps(result))

    except Exception as e:
        error_out(str(e))


def error_out(message: str):
    result = {
        "gate_open": False,
        "gate_status": "ERROR",
        "override_applied": False,
        "override_note": None,
        "profile_loaded": False,
        "profile_id": None,
        "brand": None,
        "pass1_score": 0.0,
        "pass1_pass": False,
        "pass2_score": None,
        "pass2_pass": None,
        "summary": f"Runner error: {message}",
        "action_required": "Check server logs.",
        "sections": {},
        "composer_feedback": [{"section": "all", "pass": False, "failures": [message]}],
        "job_id": None,
        "timestamp": "",
        "error": message,
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
