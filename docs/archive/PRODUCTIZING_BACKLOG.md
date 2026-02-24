# GHM Dashboard — Productizing Backlog
> Items for transforming this into a licensable/white-label COVOS platform.
> Add entries as they surface. Group by theme.

**Last Updated:** February 22, 2026

---

## Onboarding Experience

### Admin/Master Onboarding as a Productized COVOS Flow
When a new organization is onboarded onto the platform (i.e., a new admin or master-level customer), the onboarding flow needs to walk them through all third-party integration setup — not just account creation. This is not a help doc; it should be a guided, in-product wizard.

**Scope of what needs to be covered in the onboarding wizard:**

- **API configuration** — where to find each required API key, how to add it to environment config, and which features it unlocks (Wave, Resend, Gusto, etc.)
- **Multi-vendor optionality** — the platform supports swapping vendors at each integration layer (e.g., Wave → QuickBooks for accounting, Resend → SendGrid for email, Gusto → Rippling for payroll). Admins need to know what's swappable, where the abstraction lives, and how to configure their preferred vendor.
- **Integration how-to's per service** — step-by-step guidance for each supported third-party integration, surfaced contextually during setup (e.g., when they hit the "payment setup" step, show them exactly how to create a Wave account, where to find the API token, and what permissions to grant).
- **Contractor/vendor setup walkthrough** — explain the Wave vendor auto-creation flow, what the contractor receives, and what they need to do. Admins should understand this end-to-end before their first hire.
- **Environment variable checklist** — a live checklist in the UI that shows which env vars are configured and which are missing, with links to obtain each one.
- **Role and permission briefing** — explain the admin/master/sales role hierarchy, what each can and can't do, and how to configure custom permission presets.

**North star:** An admin from a completely different company should be able to take the platform from zero to fully operational — with all integrations live — without ever contacting GHM support.
