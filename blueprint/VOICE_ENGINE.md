# GHM Content Studio — Human Voice Engine
**Version:** 1.0  
**Created:** February 18, 2026  
**Depends on:** SCRVNR voice profiles (per client)  
**Purpose:** Generate content that is undetectable as AI-written by any current or near-future detection system

---

## The Threat Model

Google's Helpful Content system, GPTZero, Originality.ai, Copyleaks, Writer.com detector, Turnitin, and proprietary detectors used by various platforms all share a common approach: they model the statistical properties of AI output and flag content that matches those properties.

The goal is not to trick them. The goal is to generate content that genuinely has the properties of expert human writing — because that content also happens to be more useful, more specific, more trustworthy, and more likely to convert. Good writing and undetectable writing are the same thing.

**Getting flagged as AI content:**
- Triggers Google HCU penalties (traffic collapse)
- Triggers manual review from Google Search Quality
- Damages GHM's reputation if a client or their competitor discovers it
- Creates large-scale remediation work (rewrite everything)
- Potentially violates platform terms for some distribution channels

This is an existential risk to the Content Studio product. It must be engineered out, not hoped away.

---

## What Detectors Measure

### 1. Perplexity (Word Predictability)
Language models generate text by selecting high-probability next tokens. The output is statistically "expected" — each word is what you'd guess would come next given the context. This makes AI text low-perplexity: it follows the most likely path.

Humans are less predictable. We use specific words, unexpected comparisons, regional phrasing, industry slang, the word we personally prefer. We break patterns.

**The fix:** After generation, inject specificity. Replace generic phrasing with the precise term. Replace "many" with "about 60%." Replace "can cause problems" with "will strip the TFSI oil pump housing within 15,000 miles if you ignore it." Specificity is both lower-perplexity and more credible.

### 2. Burstiness (Sentence Length Variance)
AI output has rhythmically consistent sentence length. Humans don't. A human expert writes: three medium sentences explaining context. Then one short punchy one that lands the point. Then a long unwinding sentence that explores the nuance and exceptions and explains why the thing they just said isn't always true, particularly in cases where the car has already had the timing cover off.

Then two words. Maybe one.

**The fix:** After generation, audit sentence length distribution. Break up any run of similarly-lengthed sentences. Add deliberate short sentences (1-5 words) after key points. Add at least one sentence per section that runs long and winding with subordinate clauses.

### 3. AI-ism Phrases (Phrase Fingerprinting)
Certain phrases appear at statistically elevated rates in LLM output compared to human writing. Detectors maintain databases of these. The current known list includes:

**Hard banned — never use:**
- "In today's world" / "In today's landscape"
- "It's worth noting that"
- "It's important to note that"
- "Delve into"
- "Let's explore"
- "Firstly / Secondly / Thirdly" (as list openers)
- "In conclusion" / "To summarize" / "To wrap up"
- "Furthermore" / "Moreover" / "Additionally" (as sentence starters)
- "Navigating [abstract noun]" (e.g., "navigating the complexities of")
- "In the realm of"
- "At the end of the day"
- "It goes without saying"
- "A testament to"
- "A myriad of"
- "Leverage" (when not describing a physical lever)
- "Cutting-edge" / "state-of-the-art" / "robust" / "seamless"
- "Empower" (when not literal)
- "Ensure" as a standalone verb opener ("Ensure that your…")
- "This [noun] plays a crucial role in"
- Any sentence beginning with "Certainly" or "Absolutely"
- "Dive deep into"
- "Unlock the potential"
- "Game-changer" / "paradigm shift"

**Caution phrases — use sparingly, rewrite if appearing more than once per page:**
- "However" as a sentence opener
- "This is especially true when"
- "One of the most" (common opener)
- "When it comes to"
- "That being said"
- "With that in mind"

### 4. Over-Parallelism (Structural Tells)
AI loves parallel structure. Three bullet points, each with a bold term followed by a colon and a sentence of identical length. Five paragraphs each opening with a topic sentence, two supporting sentences, one qualifying sentence. Perfect transitions. Perfect section headers that match the exact promise in the intro.

Humans are messier. A real expert drifts. They remember a related thing mid-paragraph and insert it. They use an em dash instead of a new sentence. They write a section header that's slightly tangential. They don't end every section with a call-to-action.

**The fix:** Intentionally break at least two structural patterns per page. Vary paragraph length. Use em dashes, parentheticals, asides. Not every section needs a header. Not every header needs to be a complete sentence.

### 5. Specificity Deficit (The Commitment Problem)
AI hedges. It writes "this can sometimes cause issues" instead of "this will fail." It writes "many owners report" instead of "Audi forums have been documenting this since 2012." It writes "it's generally recommended" instead of "change it at 40,000 miles regardless of what the service interval says."

The specificity deficit is both a detection signal and a content quality problem. Authoritative human writers commit. They say the specific thing.

**The fix:** Every paragraph must contain at least one specific commitment — a number, a year, a model designation, a tool name, a part number, a price range, a failure mode description. If you can't add a specific fact, the paragraph is too thin and needs more research depth.

### 6. First-Person Absence
AI rarely uses first person naturally. When it does, it's often awkward: "As an AI language model…" Humans use first person constantly, especially in service business content: "We've seen this fail on five cars this month." "In our shop, we always replace the thermostat housing at the same time." "I'd tell my own family the same thing."

**The fix:** Seed first-person voice throughout, consistent with the SCRVNR client profile. Minimum 2-3 genuine first-person statements per page.

---

## The Scoring System (Human Voice Score)

Every piece of content gets scored before publishing. Score is 0–100. Minimum passing score: 78. Content below 78 goes back for rewrite.

### Scoring Rubric

**Specificity (25 points)**
- 25: Every paragraph has specific data, model years, part names, prices, or concrete failure descriptions
- 18: Most paragraphs specific, 1-2 are thin/generic
- 10: Several generic paragraphs, vague claims throughout
- 0: Consistently generic, no committed claims

**Sentence Variance / Burstiness (20 points)**
- 20: Clear mix of short punchy and long complex sentences, intentional rhythm breaks
- 14: Some variance but rhythmically consistent sections
- 8: Mostly uniform sentence length throughout
- 0: Robotically consistent sentence length

**Phrase Cleanliness (25 points)**
- 25: Zero hard-banned phrases, caution phrases under 1 per 500 words
- 18: No hard-banned, caution phrases within tolerance
- 10: 1-2 hard-banned phrases present
- 0: Multiple hard-banned phrases, high caution phrase density

**Voice Authenticity (15 points)**
- 15: First person present, client voice clearly recognizable, sounds like a human expert
- 10: Mostly authentic, a few stiff passages
- 5: Formally correct but no personality, generic expert voice
- 0: Clearly institutional/AI voice

**Structural Variety (15 points)**
- 15: Paragraph lengths vary, headers don't all follow same pattern, transitions are varied
- 10: Some structural variety, some over-parallel sections
- 5: Mostly parallel structure throughout
- 0: Perfect uniformity — exactly what AI produces

### Scoring Process

1. Generate initial content using SCRVNR profile
2. Run self-scoring pass: apply rubric, assign score
3. If score < 78: identify lowest-scoring dimensions, rewrite those sections
4. Re-score
5. Repeat until ≥ 78
6. Flag for human review if any section required more than 2 rewrites (may have deeper voice/accuracy problem)

**Maximum 3 recursive loops before human intervention is required.** If content can't pass in 3 passes, the brief was likely under-specified. Return to brief, add more context, regenerate from scratch.

---

## Integration with SCRVNR

SCRVNR captures the client's existing voice: formality level, contraction rate, technical vocabulary, trust signal patterns, sentence opener preferences, paragraph length norms.

The Human Voice Engine operates on top of SCRVNR. SCRVNR tells us *whose* voice to write in. The Voice Engine tells us *how* to make that voice undetectable.

They are complementary. A SCRVNR profile for a casual, conversational client makes the burstiness and specificity rules easier to hit naturally. A more formal client voice requires more deliberate intervention to hit the same scores.

**Client voice profile always takes precedence** in case of conflict. If a client's authentic voice uses "furthermore" regularly, we don't ban it — we use it at the human rate (not the AI rate). The goal is not to sound like a generic human. It's to sound like *this specific human business.*

---

## Google Helpful Content System (HCU) — Specific Considerations

Google's HCU evaluates content at the site level, not just the page level. One site full of thin AI-written pages pulls down rankings for the whole domain, including pages that were written by humans. This means:

1. Every piece of content we publish under a client's domain (hub extensions especially) affects their entire site's HCU score
2. Satellite sites are isolated — a failing satellite doesn't damage the main site
3. Hub extensions are high-stakes — they need to be the best content on the site, not just passing

**HCU checklist (every hub extension page):**
- Does this page provide information that isn't easily available elsewhere?
- Would a subject-matter expert recognize this as accurate and substantive?
- Is there a clear reason for a human to have written this (shop experience, local context, specific model knowledge)?
- Does the page demonstrate first-hand experience (e.g., "We've replaced dozens of these in Simi Valley and here's what we've learned")?
- Is the content primarily written for humans, with SEO as a secondary consideration?

If any of these fail, the page needs more depth before publishing. A page that passes HCU naturally also passes AI detection — they're measuring similar things from different angles.

---

## Ongoing Monitoring

**Per page, post-publish:**
- Run through Originality.ai monthly (or after major content updates)
- Flag any page scoring above 30% AI probability for rewrite review
- Monitor Google Search Console for HCU-related traffic drops on the domain

**Per client, quarterly:**
- Full site audit for AI detection scores
- Voice consistency check (does the content still sound like the client?)
- Update banned phrase list as new AI-isms are identified by detectors

**Staying ahead of detectors:**
Detection tools update their models. Our defense is to generate content that is *actually good* — not to reverse-engineer detector models. Good writing has high perplexity, good burstiness, specific claims, authentic voice. Those properties don't change. If we hit them consistently, no detection model update can catch us because we're not producing AI content in the statistical sense, even if we used AI to draft it.

---

**Document status:** Complete  
**Next:** Apply to all GAD content generation
