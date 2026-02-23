# SPRINT 5 — REPORTS
## AI Narrative Layer + Auto-Generation via Recurring Tasks
*Dependency: Sprint 1 (recurring tasks), Sprint 2 (site health), Sprint 3 (GBP + rankings)*

---

## GOAL

Add AI-generated narrative sections to existing report system and automate monthly report generation via RecurringTaskRule. Extends ClientReport — does NOT create new report tables.

---

## EXISTING INFRASTRUCTURE (Use, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| ClientReport table | Schema | ✅ type, periodStart, periodEnd, content (Json), pdfUrl, sentToClient |
| Report generator | src/lib/reports/generator.ts | ✅ Orchestrates section generation |
| Report template | src/lib/reports/template.ts | ✅ Template structure |
| Report sections | src/lib/reports/sections/ | ✅ citation-health, gbp-performance, ppc-performance, rank-tracking |
| AI client + router | src/lib/ai/ | ✅ Model routing, cost tracking |
| VoiceProfile | Schema | ✅ Client-specific tone |

---

## DELIVERABLES

### D1: AI Narrative Generator

**Location:** `src/lib/reports/ai-narrative.ts`

For each report section, generate a narrative paragraph:
- Feed section data (rankings, health scores, GBP metrics, etc.) to AI client
- Use VoiceProfile for tone matching
- Use model router (Haiku for simple summaries, Sonnet for complex analysis)
- Add narrative to ClientReport.content Json under each section's `narrative` field

**Narrative sections:**
- Executive summary (overall performance narrative)
- Ranking changes (keyword movement analysis)
- Site health trends (Core Web Vitals narrative)
- GMB performance (engagement narrative)
- Competitive positioning (health score context)
- Recommended next steps (AI-prioritized action items)

### D2: Auto-Report Generation

**Seed RecurringTaskRule:**
```json
{
  "name": "Monthly Client Report",
  "clientId": null,  // All active clients
  "category": "reporting",
  "title": "Generate monthly report for {clientName}",
  "priority": "P2",
  "cronExpression": "0 9 1 * *",  // 1st of month at 9am
  "checklistTemplateId": <reporting_template_id>
}
```

**Checklist template "monthly_report":**
- Compile ranking data
- Compile site health data
- Compile GBP metrics
- Generate AI narratives
- Review report
- Generate PDF
- Send to client

### D3: One-Click Report Generation

**API route:** `/api/clients/[id]/reports/generate`
- Gathers all available data (scans, snapshots, rankings)
- Calls AI narrative generator for each section
- Creates ClientReport record
- Generates PDF (extend existing template)
- Returns report for review before sending

### D4: Client Detail Extension

Extend client detail page with "Reports" section:
- List of generated reports with date, status, PDF link
- "Generate Report" button
- "Send to Client" action (marks sentToClient = true, sends email)

---

## FILE CREATION ORDER

1. `src/lib/reports/ai-narrative.ts` — AI narrative generation
2. Extend `src/lib/reports/generator.ts` — Integrate AI narratives
3. `/api/clients/[id]/reports/generate/route.ts` — On-demand generation
4. Seed RecurringTaskRule + TaskChecklistTemplate for monthly reports
5. Client detail page Reports section
6. Extend report PDF template with narrative sections

---

## TESTING CRITERIA

- [ ] AI narrative generates for each report section
- [ ] VoiceProfile tone reflected in narrative
- [ ] RecurringTaskRule creates monthly report tasks for all clients
- [ ] One-click generation compiles all available data
- [ ] PDF generation includes narrative sections
- [ ] "Send to Client" marks report as sent and fires email
- [ ] Report history visible on client detail page
- [ ] Cost tracking logged to AICostLog
