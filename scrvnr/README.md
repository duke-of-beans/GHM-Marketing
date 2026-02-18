# GHM SCRVNR

**Version:** 1.0.0  
**Status:** Core engine complete  
**Purpose:** AI detection + voice alignment gate for Website Studio content pipeline

---

## What This Is

SCRVNR is the mandatory quality gate in the Website Studio build pipeline. Every page of generated copy passes through it before reaching human review. It runs two passes:

**Pass 1 — AI Detection Defense**  
Statistical analysis that catches the measurable markers of LLM-generated text: flat sentence rhythm, known AI-ism phrases, parallel structure overuse, hedge density, vague specificity, and formal transition tells. No LLM required. Pure signal detection.

**Pass 2 — Voice Alignment**  
Compares copy against a captured client brand voice profile. Scores alignment across reading level, sentence rhythm, contraction rate, specificity level, register (formality/warmth), native construction presence, and negative space violations. Each client gets their own profile. Pass 2 is meaningless without a profile — incomplete profiles get partial scoring with a warning.

Both passes must clear for the gate to open. Human override is always available but requires a written note and creates an audit trail. Override never silently bypasses — it just unlocks with documentation.

---

## Architecture

```
scrvnr/
├── core/
│   ├── pass1_ai_detection.py        # Pass 1 engine
│   ├── pass2_voice_alignment.py     # Pass 2 engine
│   ├── scrvnr_gate.py               # Orchestrator — the only file you need to call
│   └── voice_profile_extractor.py  # DNA Lab extraction engine
├── profiles/                        # Client voice profiles (one JSON per brand)
│   └── {client-slug}-{brand-slug}.json
├── schemas/
│   └── voice_profile_schema.json   # Profile structure spec
└── README.md                        # This file
```

The three core engines + the schema are the complete system. No database. No external services. No LLM calls. All analysis is statistical and pattern-based.

---

## How It Fits Into Website Studio

```
Page Composer (human edits content)
        ↓
SCRVNR Gate (scrvnr_gate.py)
        ├── Pass 1: AI Detection
        └── Pass 2: Voice Alignment
        ↓
   GATE OPEN?
    ├── Yes → Human Review Queue
    └── No  → Flagged with specific failures + suggestions
              Human Override available (with required note)
```

The Website Studio UI shows SCRVNR status in the Page Composer as a live indicator. Sections are analyzed individually so the composer can flag specific paragraphs rather than failing the whole page.

---

## Quick Start

### Run the Gate (API usage)

```python
from scrvnr.core.scrvnr_gate import SCRVNRGate

# With a voice profile (full two-pass gate)
gate = SCRVNRGate(profile_path="scrvnr/profiles/gad-main.json")

result = gate.run(sections={
    "hero": "At German Auto Doctor...",
    "services": "We specialize in BMW...",
    "cta": "Book your service today..."
})

print(result["gate_open"])    # True / False
print(result["gate_status"])  # "PASS" / "FAIL" / "OVERRIDE"
print(result["summary"])      # Human-readable one-liner
print(result["action_required"])
```

### Run the Gate (CLI)

```bash
# Pass 1 only (no profile)
python core/scrvnr_gate.py page_content.txt

# Full two-pass
python core/scrvnr_gate.py page_content.txt profiles/gad-main.json

# JSON output
python core/scrvnr_gate.py page_content.txt profiles/gad-main.json --json

# Human override
python core/scrvnr_gate.py page_content.txt profiles/gad-main.json --override "Timeline constraint — client approved"
```

### Capture a Voice Profile

```python
from scrvnr.core.voice_profile_extractor import VoiceProfileExtractor

extractor = VoiceProfileExtractor()

with open("source_copy.txt") as f:
    text = f.read()

profile = extractor.extract(
    text=text,
    client_slug="german-auto-doctor",
    brand_slug="main",
    brand_display_name="German Auto Doctor",
    source_url="https://germanauto.doctor",
    tier_scope=["T1", "T2"]
)

extractor.save(profile, "scrvnr/profiles/gad-main.json")
```

### CLI Profile Extraction

```bash
python core/voice_profile_extractor.py source_copy.txt german-auto-doctor main profiles/gad-main.json
```

---

## Pass 1 Scoring Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Burstiness | 25% | Sentence length variance. LLMs write flat; humans write bursty. Target burstiness >0.60. |
| AI-isms | 25% | Known LLM-overrepresented phrases. 0 violations = 1.0, drops with each hit. |
| Parallel structure | 15% | Bullet uniformity + repeated sentence openers. |
| Hedge density | 15% | Qualifying language per 100 words. |
| Specificity | 10% | Concrete numbers, model names, measurements vs. vague quantity words. |
| Transition tells | 10% | Formal transitions LLMs overuse (furthermore, moreover, in conclusion). |

**Default pass threshold: 0.65**

---

## Pass 2 Scoring Dimensions

All dimensions scored against the loaded client profile. Weights normalize automatically based on what's defined in the profile.

| Dimension | Default Weight | What It Compares |
|-----------|---------------|-----------------|
| Reading level | 15% | FK grade vs. profile target range |
| Sentence rhythm | 15% | Burstiness vs. profile burstiness |
| Contraction rate | 20% | Measured rate vs. profile target |
| Specificity | 10% | Level vs. profile specificity level |
| Register | 10% | Formality + warmth vs. profile scores |
| Native constructions | 20% | Brand-specific phrase hit rate |
| Negative space | 10% | Zero tolerance for "never say" patterns |

**Default pass threshold: 0.60** (lower than Pass 1 because profiles are never perfectly captured)

---

## Voice Profile Structure

Profiles live in `scrvnr/profiles/` as `{client-slug}-{brand-slug}.json`.

**Naming convention:**
- `gad-main.json` — German Auto Doctor, main brand
- `gad-audi.json` — German Auto Doctor, Audi satellite brand (if different voice)
- `thiccles-main.json` — THICCLES main brand

A client can have multiple brand profiles if their satellites use meaningfully different voices. Most T1 site extensions inherit the client profile. T2 and T3 satellites with distinct brand identities need their own.

**Key profile fields:**

```json
{
  "profile_id": "gad-main",
  "client_slug": "german-auto-doctor",
  "brand_slug": "main",
  "reading_level": {
    "flesch_kincaid_grade": 9.2,
    "target_min": 7.7,
    "target_max": 10.7
  },
  "sentence_rhythm": {
    "burstiness_score": 0.72
  },
  "contraction_rate": {
    "measured": 0.31,
    "target_min": 0.21,
    "target_max": 0.41
  },
  "native_constructions": {
    "items": [
      {"pattern": "german automotive", "confidence": 0.85, "frequency": 4},
      {"pattern": "factory trained", "confidence": 0.80, "frequency": 3}
    ]
  },
  "negative_space": {
    "items": [
      "we're passionate about",
      "our team of experts",
      "competitive prices"
    ]
  }
}
```

The `negative_space` field is the only one that requires human input. Everything else is machine-extracted. Human reviewers should populate negative space during the DNA Lab interview — it's the most powerful alignment signal.

---

## Human Override

Override is always available. It never silently bypasses — it requires a note and the audit trail is immutable.

```python
result = gate.run(
    sections=sections,
    override=True,
    override_note="Client approved copy on 2026-02-18 — schedule constraint"
)
```

`result["gate_status"]` will be `"OVERRIDE"` rather than `"PASS"` or `"FAIL"`. The override note is preserved in the result for the Website Studio audit log.

Override does not change the scores. Both pass scores are still calculated and returned — the override just unlocks the gate despite the failure. This keeps the data honest.

---

## Integration Points

### Website Studio — Page Composer
- Call `gate.run_section()` per section on content change (debounced)
- Display pass/fail indicator inline next to each section
- Show dimension failures as hover detail
- Surface `action_required` as the primary guidance copy

### Website Studio — Build Pipeline
- Full `gate.run()` on final page before queuing for human review
- Block progression to Review stage if `gate_open == False` and `override_applied == False`
- Log result to audit trail regardless of outcome

### DNA Lab — Profile Capture
- Run `VoiceProfileExtractor.extract()` on scraped site content
- Save profile to `scrvnr/profiles/{client-slug}-{brand-slug}.json`
- Make profile selectable in property settings
- Show confidence flags to human reviewer

---

## What's Different From the Personal SCRVNR

The original SCRVNR at `D:\SCRVNR\` is David's personal voice synthesis system — it learns David's voice from examples, enforces David's specific patterns, and applies David's environment calibrations across 5 contexts.

This GHM SCRVNR is a **multi-client quality gate**:
- No personal voice involved
- No SQLite learning loop (profiles are the source of truth)
- Profile-driven: each client brand has its own baseline
- Two-pass architecture with explicit gate decision
- Built for pipeline integration, not interactive conversation
- Override-with-audit rather than override-silently

Same underlying philosophy (statistical voice analysis), completely different implementation and purpose.

---

## Extending

**Add new AI-ism phrases to Pass 1:**
Edit `AI_ISMS` list in `pass1_ai_detection.py`. No other changes needed.

**Add new profile fields for Pass 2:**
Add field to `voice_profile_schema.json`, add scorer method to `VoiceAligner`, add weight to the `weights` dict, add extractor logic to `VoiceProfileExtractor`.

**Change pass thresholds:**
Pass thresholds at `SCRVNRGate(pass1_threshold=0.70, pass2_threshold=0.65)`. Or change the class-level defaults.

**Add new trust signal patterns:**
Edit `TRUST_PATTERNS` dict in `voice_profile_extractor.py`.

---

## Status

| Component | Status |
|-----------|--------|
| Pass 1 — AI Detection | Complete |
| Pass 2 — Voice Alignment | Complete |
| Gate Orchestrator | Complete |
| Voice Profile Extractor | Complete |
| Profile Schema | Complete |
| Website Studio integration | Pending (build phase) |
| DNA Lab UI integration | Pending (build phase) |
| German Auto Doctor profile | Pending (needs source text scrape) |

**Next step:** Scrape German Auto Doctor site content, run `VoiceProfileExtractor`, create the first real client profile. Then wire `SCRVNRGate` into the Website Studio Page Composer.

---

Version 1.0.0 | 2026-02-18 | GHM Platform
