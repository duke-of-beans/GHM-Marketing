# INFRA-001: Resend Domain Verification — Ops Runbook
**Created:** February 25, 2026
**Estimated time:** 10–15 minutes (DNS propagation may take up to 48 hrs, usually <30 min)
**Prerequisite:** Access to Resend dashboard + DNS registrar for `ghmmarketing.com`

---

## What This Fixes

Every outbound email from the GHM Dashboard — forgot password, notifications, work orders, reports, onboarding confirmations, contractor invites — sends from `noreply@ghmmarketing.com` via Resend. Without domain verification, Resend either rejects the send or routes through a shared sending pool that lands in spam. This is why forgot password emails (BUG-026) aren't arriving.

## Current Code Config

The email layer is in `src/lib/email/index.ts`:

```
FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ghmmarketing.com"
FROM_NAME = "GHM Marketing"
```

All email functions (`sendNotificationEmail`, `sendWorkOrderEmail`, `sendReportEmail`, etc.) use this sender identity. No code changes needed — this is purely a DNS + Resend dashboard action.

---

## Steps

### 1. Resend Dashboard — Add Domain

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter: `ghmmarketing.com`
4. Resend will generate **3 DNS records** you need to add:
   - **SPF** — TXT record (usually `v=spf1 include:resend.com ~all` or similar)
   - **DKIM** — TXT or CNAME record (Resend-specific key)
   - **DMARC** — TXT record (usually `v=DMARC1; p=none;` to start)

> **Copy each record exactly.** Name, type, and value must match precisely.

### 2. DNS Registrar — Add Records

Go to the DNS management for `ghmmarketing.com` (wherever the domain is registered — GoDaddy, Namecheap, Cloudflare, etc.).

Add each of the 3 records Resend gave you. Common pitfalls:
- Some registrars auto-append the domain to the record name. If Resend says the name is `resend._domainkey.ghmmarketing.com`, your registrar might only need `resend._domainkey`.
- TTL: use the default (usually 3600 or "Auto").
- If there's an existing SPF record, **merge** — don't create a second one. Add `include:resend.com` to the existing SPF value.

### 3. Resend Dashboard — Verify

Back in Resend → Domains, click **Verify** on `ghmmarketing.com`. If DNS has propagated, all 3 records will show green checkmarks. If not, wait 15–30 minutes and try again.

### 4. Verify Env Vars in Vercel

Go to [Vercel Dashboard](https://vercel.com) → ghm-marketing project → Settings → Environment Variables.

Confirm these exist for **Production** (and Preview if you want email in preview deploys):

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Your Resend API key (starts with `re_`) |
| `FROM_EMAIL` | `noreply@ghmmarketing.com` |

If `FROM_EMAIL` is missing, add it. The code defaults to `noreply@ghmmarketing.com` but it's better to have it explicit.

### 5. Test

Option A — Trigger forgot password flow:
1. Go to `ghm.covos.app/login`
2. Click "Forgot password?"
3. Enter your email
4. Check inbox (and spam) within 1 minute

Option B — Check Vercel runtime logs:
1. Vercel Dashboard → Deployments → latest → Functions tab
2. Look for `POST /api/auth/forgot-password` logs
3. If email fails, you'll see: `Forgot password: email send failed { to: "...", error: "..." }`

### 6. Close INFRA-001

Once email arrives successfully:
1. Delete INFRA-001 from `BACKLOG.md`
2. Add row to `CHANGELOG.md`: `INFRA-001 COMPLETE — Resend domain verified, email delivery live`
3. Update `STATUS.md` Last Updated line
4. Commit: `docs: INFRA-001 Resend domain verified`

BUG-026 (forgot password email) is automatically resolved when INFRA-001 is done — no additional code changes needed.

---

## Future: Multi-Tenant Email

When COVOS has multiple tenants, each will want their own sending domain. The `FROM_EMAIL` should eventually be pulled from `TenantConfig` rather than a global env var. This is tracked under FEAT-016 scope — not blocking now.
