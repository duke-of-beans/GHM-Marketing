"""
GHM SCRVNR Smoke Test
======================
Verifies all three engines work end to end.
No external dependencies. Run from the scrvnr/ directory.

Usage:
    cd D:\Work\SEO-Services\ghm-dashboard\scrvnr
    python test_smoke.py

All tests should pass. Any failures indicate an import or logic error
to fix before integrating with Website Studio.
"""

import sys
import json
import os

# Run from scrvnr/ — add core/ to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "core"))

from pass1_ai_detection import AIDetector
from pass2_voice_alignment import VoiceAligner
from scrvnr_gate import SCRVNRGate
from voice_profile_extractor import VoiceProfileExtractor


# ── Sample text: human-sounding, specific, bursty ─────────────────────────────
GOOD_TEXT = """
We've been fixing German cars in Simi Valley since 2004. Not BMWs in general —
BMWs specifically: E46, E90, F30, G20. The throttle body on a 2007 335i behaves
differently under load than the same part on a 2012 335i. That distinction matters.

Our diagnostic rate is $149. That covers the full system scan, a road test if
warranted, and a written estimate you keep regardless of whether you proceed.

It's not magic. It's 20 years of doing one thing and getting better at it.
"""

# ── Sample text: AI-flavored, flat, hedged ────────────────────────────────────
BAD_TEXT = """
In today's competitive automotive service landscape, it is important to note that
our team of dedicated professionals is passionate about delivering world-class
solutions to all your vehicle maintenance needs. Furthermore, we pride ourselves
on our commitment to excellence and our ability to leverage cutting-edge diagnostic
technology to provide unparalleled service. We look forward to hearing from you.

Perhaps you are wondering what sets us apart. Our certified technicians work
tirelessly to ensure that each and every customer receives the best possible
experience. Moreover, we offer a wide variety of services for a number of
different makes and models. In conclusion, we are dedicated to providing
comprehensive automotive care for your complete satisfaction.
"""

TESTS_PASSED = 0
TESTS_FAILED = 0

def check(name, condition, detail=""):
    global TESTS_PASSED, TESTS_FAILED
    if condition:
        print(f"  PASS  {name}")
        TESTS_PASSED += 1
    else:
        print(f"  FAIL  {name}{(' — ' + detail) if detail else ''}")
        TESTS_FAILED += 1


# ─────────────────────────────────────────────────────────────────────────────
# PASS 1: AI Detection
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("PASS 1 — AI DETECTION ENGINE")
print("=" * 60)

detector = AIDetector()

# Good text should pass
good_result = detector.analyze_section(GOOD_TEXT, section_name="good")
print(f"\n  Good text score: {good_result['overall_score']:.0%}")
check("Good text passes Pass 1", good_result["pass"],
      f"score={good_result['overall_score']:.2f}")

# Bad text should fail
bad_result = detector.analyze_section(BAD_TEXT, section_name="bad")
print(f"  Bad text score:  {bad_result['overall_score']:.0%}")
check("Bad text fails Pass 1", not bad_result["pass"],
      f"score={bad_result['overall_score']:.2f}")

# Burstiness dimension present
check("Burstiness dimension returned",
      "burstiness" in good_result["dimensions"])

# Bad text has AI-ism violations
ai_ism_violations = bad_result["dimensions"]["ai_isms"]["violations_found"]
check("AI-isms detected in bad text", ai_ism_violations > 0,
      f"found {ai_ism_violations}")

# Bad text has hedge violations
hedge_density = bad_result["dimensions"]["hedge_density"]["density_per_100_words"]
check("Hedge density detected in bad text", hedge_density > 0.5,
      f"density={hedge_density:.2f}/100 words")

# Good text has higher specificity
good_specificity = good_result["dimensions"]["specificity"]["specificity_density"]
bad_specificity = bad_result["dimensions"]["specificity"]["specificity_density"]
check("Good text more specific than bad text", good_specificity > bad_specificity,
      f"good={good_specificity:.2f} bad={bad_specificity:.2f}")

# Multi-section document analysis
doc_result = detector.analyze_document({
    "hero": GOOD_TEXT,
    "cta": BAD_TEXT,
})
check("Document analysis returns correct structure",
      "section_results" in doc_result and "failed_sections" in doc_result)
check("Document analysis identifies failed section",
      "cta" in doc_result["failed_sections"],
      f"failed={doc_result['failed_sections']}")

# Empty section handled gracefully
empty_result = detector.analyze_section("", section_name="empty")
check("Empty section handled gracefully",
      empty_result["pass"] and empty_result["overall_score"] == 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# VOICE PROFILE EXTRACTOR
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("VOICE PROFILE EXTRACTOR")
print("=" * 60)

extractor = VoiceProfileExtractor()
profile = extractor.extract(
    text=GOOD_TEXT * 4,  # Repeat for enough sample size
    client_slug="test-client",
    brand_slug="main",
    brand_display_name="Test Client",
    source_url="https://test.example.com",
    tier_scope=["T1", "T2"],
)

print(f"\n  FK Grade:         {profile['reading_level']['flesch_kincaid_grade']}")
print(f"  Burstiness:       {profile['sentence_rhythm']['burstiness_score']}")
print(f"  Contraction rate: {profile['contraction_rate']['measured']:.0%}")
print(f"  Specificity:      {profile['technical_specificity']['level']}")
print(f"  Formality:        {profile['register']['formality_score']}/10")
print(f"  Warmth:           {profile['register']['warmth_score']}/10")
print(f"  Trust pattern:    {profile['trust_signal_pattern']['type']}")
print(f"  Native patterns:  {len(profile['native_constructions']['items'])} extracted")
print(f"  Confidence:       {profile['capture_confidence']['overall']}")

# Required fields present
required_fields = [
    "profile_id", "client_slug", "brand_slug", "reading_level",
    "sentence_rhythm", "contraction_rate", "technical_specificity",
    "register", "trust_signal_pattern", "native_constructions",
    "negative_space", "vocabulary", "capture_confidence",
]
for field in required_fields:
    check(f"Profile has '{field}'", field in profile)

# Reading level reasonable
fk = profile["reading_level"]["flesch_kincaid_grade"]
check("Reading level in plausible range", 3.0 <= fk <= 18.0, f"FK={fk}")

# Burstiness present
burst = profile["sentence_rhythm"]["burstiness_score"]
check("Burstiness extracted", burst is not None and burst > 0, f"burstiness={burst}")

# Target range derived correctly from reading level
rl = profile["reading_level"]
check("Reading level target range derived",
      rl["target_min"] == round(max(1.0, fk - 1.5), 1) and
      rl["target_max"] == round(min(20.0, fk + 1.5), 1))

# Profile serializes to JSON cleanly
try:
    json_str = json.dumps(profile)
    check("Profile serializes to JSON", True)
except Exception as e:
    check("Profile serializes to JSON", False, str(e))

# Save/load roundtrip
import tempfile, pathlib
with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w") as f:
    tmp_path = f.name
try:
    saved = extractor.save(profile, tmp_path)
    with open(saved, "r") as f:
        loaded = json.load(f)
    check("Profile save/load roundtrip", loaded["profile_id"] == "test-client-main")
finally:
    pathlib.Path(tmp_path).unlink(missing_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# PASS 2: Voice Alignment
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("PASS 2 — VOICE ALIGNMENT ENGINE")
print("=" * 60)

# Add negative space and native constructions to make Pass 2 meaningful
profile["negative_space"]["items"] = [
    "passionate about", "world-class", "in today's", "look forward to"
]
profile["native_constructions"]["items"] = [
    {"pattern": "german cars", "confidence": 0.85, "frequency": 3},
    {"pattern": "diagnostic rate", "confidence": 0.80, "frequency": 2},
]

aligner = VoiceAligner(profile)

# Good text should align with profile extracted from same text
good_align = aligner.analyze_section(GOOD_TEXT, section_name="good")
print(f"\n  Good text alignment score: {good_align['overall_score']:.0%}")
check("Good text passes Pass 2", good_align["pass"],
      f"score={good_align['overall_score']:.2f}")

# Bad text should violate negative space (it contains "passionate about", "world-class", "in today's", "look forward to")
bad_align = aligner.analyze_section(BAD_TEXT, section_name="bad")
print(f"  Bad text alignment score:  {bad_align['overall_score']:.0%}")
ns_violations = bad_align["dimensions"].get("negative_space", {}).get("violation_count", 0)
check("Negative space violations detected in bad text", ns_violations > 0,
      f"violations={ns_violations}")

# Dimensions returned
expected_dims = ["contraction_rate", "native_constructions", "negative_space"]
for dim in expected_dims:
    check(f"Pass 2 returns '{dim}' dimension",
          dim in good_align["dimensions"])

# Sparse profile (no targets) returns graceful result
sparse_profile = {"profile_id": "sparse", "brand_display_name": "Sparse"}
sparse_aligner = VoiceAligner(sparse_profile)
sparse_result = sparse_aligner.analyze_section(GOOD_TEXT)
check("Sparse profile handled gracefully",
      "pass" in sparse_result and sparse_result["overall_score"] >= 0.70)


# ─────────────────────────────────────────────────────────────────────────────
# GATE ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("GATE ORCHESTRATOR")
print("=" * 60)

# Pass 1 only (no profile)
gate_p1_only = SCRVNRGate()
result_p1_only = gate_p1_only.run_section(GOOD_TEXT)
check("Gate (Pass 1 only) runs without profile", "gate_open" in result_p1_only)
check("Pass 2 marked inactive when no profile",
      result_p1_only["pass2"]["active"] == False)

# Full gate with profile
gate_full = SCRVNRGate(profile_dict=profile)
result_good = gate_full.run_section(GOOD_TEXT, section_name="good")
result_bad = gate_full.run_section(BAD_TEXT, section_name="bad")

print(f"\n  Good text gate: {result_good['gate_status']}  (P1: {result_good['pass1']['score']:.0%}, P2: {result_good['pass2']['score']:.0%})")
print(f"  Bad text gate:  {result_bad['gate_status']}   (P1: {result_bad['pass1']['score']:.0%}, P2: {result_bad['pass2']['score']:.0%})")

check("Good text gate opens", result_good["gate_open"],
      f"status={result_good['gate_status']}")
check("Bad text gate closes", not result_bad["gate_open"],
      f"status={result_bad['gate_status']}")

# Gate result has required keys
required_gate_keys = [
    "gate_open", "gate_status", "pass1", "pass2",
    "sections", "summary", "action_required", "timestamp"
]
for key in required_gate_keys:
    check(f"Gate result has '{key}'", key in result_good)

# Override mechanics
override_result = gate_full.run_section(
    BAD_TEXT,
    override=True,
    override_note="Client approved, deadline constraint"
)
check("Override opens gate on failing content", override_result["gate_open"])
check("Override status is 'OVERRIDE'", override_result["gate_status"] == "OVERRIDE")
check("Override note preserved", override_result["override_note"] == "Client approved, deadline constraint")
check("Override scores still calculated (not zeroed)",
      override_result["pass1"]["score"] > 0)

# Multi-section document
sections = {
    "hero": GOOD_TEXT,
    "services": GOOD_TEXT[:200],
    "cta": BAD_TEXT,
}
doc_gate = gate_full.run(sections)
check("Multi-section gate returns all sections",
      set(doc_gate["sections"].keys()) == {"hero", "services", "cta"})
check("Multi-section gate fails on bad section",
      not doc_gate["gate_open"])

# Summary and action always populated
check("Summary always populated", bool(result_good["summary"].strip()))
check("Action always populated", bool(result_good["action_required"].strip()))
check("Timestamp in result", "Z" in result_good["timestamp"])


# ─────────────────────────────────────────────────────────────────────────────
# FINAL REPORT
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
total = TESTS_PASSED + TESTS_FAILED
print(f"RESULTS: {TESTS_PASSED}/{total} passed")
if TESTS_FAILED == 0:
    print("All tests passed. SCRVNR engines are operational.")
else:
    print(f"{TESTS_FAILED} test(s) failed. Resolve before integrating with Website Studio.")
print("=" * 60 + "\n")

sys.exit(0 if TESTS_FAILED == 0 else 1)
