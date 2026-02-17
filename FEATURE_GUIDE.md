# GHM Dashboard - Complete Feature Guide
**Last Updated:** February 17, 2026  
**Version:** 2.0 - Sprint Complete

---

## 📚 Table of Contents
1. Content Management
2. Voice Intelligence
3. Bug Reporting
4. Lead Filtering
5. Settings & Configuration

---

## 1️⃣ CONTENT MANAGEMENT

### Content Scheduling & Publishing
**What it does:** Schedule content for future publication with automated posting.

**How to use:**
1. Generate content in Content Studio
2. Click "Schedule" button on any content item
3. Choose publication date/time
4. System automatically publishes at scheduled time

**Status Flow:**
- `draft` → `scheduled` → `published`

**Pro Tips:**
- Schedule a month of content in advance
- Use batch operations to schedule multiple items
- Monitor scheduled content in Content Review tab

---

### Batch Content Operations
**What it does:** Perform actions on multiple content items simultaneously for efficiency.

**Available Operations:**
- Bulk delete selected items
- Bulk schedule (future feature)

**How to use:**
1. Navigate to Content Studio
2. Select items using checkboxes
3. Click "Batch Actions" dropdown
4. Choose operation (e.g., "Delete Selected")

**Safety Features:**
- Confirmation dialog before destructive actions
- Shows count of items affected
- Cannot be undone (be careful!)

---

### Content Versioning System
**What it does:** Automatically saves complete history of every edit with restore capability.

**Key Features:**
- **Auto-versioning:** Every save creates a snapshot
- **Change notes:** Optional description of what changed
- **Full restore:** Revert to any previous version
- **Audit trail:** Who made changes and when

**How to use:**
1. Edit any content item
2. Add "Change Note" (optional but recommended)
3. Save - version automatically created
4. Click "History" button to view all versions
5. Click "Restore" on any version to revert

**What's preserved:**
- Complete content snapshot
- Metadata (title, keywords, etc.)
- Timestamp and user
- Your change notes

**Pro Tips:**
- Use descriptive change notes ("Fixed typo" vs "Updated intro paragraph to emphasize ROI")
- Review version history before major edits
- Restore feature is instantaneous - creates new version from old one

---

## 2️⃣ VOICE INTELLIGENCE (SCRVNR)

### Capturing Brand Voice
**What it does:** Analyzes client websites to extract unique writing style and tone for authentic AI content.

**How it works:**
1. Scans client website pages
2. Analyzes tonality, vocabulary, sentence structure
3. Extracts brand characteristics
4. Creates reusable voice profile

**What gets captured:**
- **Tonality:** Professional, casual, friendly, authoritative, etc.
- **Vocabulary:** Industry jargon, common phrases, word patterns
- **Sentence Structure:** Length preference, complexity, rhythm
- **Characteristics:**
  - Formality (1-10 scale)
  - Enthusiasm (1-10 scale)
  - Technical depth (1-10 scale)
  - Brevity preference (1-10 scale)

**How to use:**
1. Open client profile
2. Click "Capture Voice" button (top right)
3. Wait 20-40 seconds for analysis
4. Voice profile auto-applies to all generators

**Where it appears:**
- Blog post generator (Custom Voice badge)
- Social media generator
- Meta description generator
- Look for green "Custom Voice Active" indicator

**Managing voice profiles:**
- **Recapture:** Click "Capture Voice" again to update
- **Remove:** Click "Remove Voice" to use generic AI
- **Fully reversible:** Can capture/remove anytime

**Pro Tips:**
- Recapture if client redesigns website
- Works best with 5+ pages of content
- Use for clients with distinct brand voice
- Remove for generic service businesses

---

## 3️⃣ BUG REPORTING SYSTEM

### Reporting Issues
**What it does:** Enterprise-grade bug tracking with automatic technical metadata capture.

**How to report:**
1. Click "Report Bug" button (sidebar footer)
2. Enter title and description
3. Select category and severity
4. Submit - metadata captured automatically

**Categories:**
- Content Studio
- Compensation/Finance
- Competitive Scans
- Client Management
- Lead Pipeline
- UI/Design
- Performance
- Other

**Severity Levels:**
- **Critical:** System down, data loss, security issue
- **High:** Major feature broken, blocking work
- **Medium:** Feature partially broken, workaround exists
- **Low:** Minor cosmetic issue, enhancement request

**Auto-captured metadata:**
- Current page URL
- Browser and OS info
- Screen resolution
- Console errors (last 10)
- Network errors (last 5)
- Recent user actions (last 5)

**What happens next:**
1. Bug auto-assigned to David Kirsch
2. Priority set based on severity
3. Master users can view in Bug Reports page
4. You'll be notified when resolved

**Pro Tips:**
- Be specific in descriptions
- Include steps to reproduce
- Attach screenshots if helpful (via description)
- Check Bug Reports page to see if already reported

---

### Error Boundary Integration
**What it does:** Crash detection with one-click bug reporting.

**How it works:**
- If page crashes, error boundary appears
- Shows "Report This Error" button
- Error details pre-filled automatically
- Submit with one click

**Pre-filled info:**
- Error message
- Stack trace
- Error digest
- Page where crash occurred

---

## 4️⃣ ADVANCED LEAD FILTERING

### Filter Categories

**Priority & Quality**
- Impact Score (0-100): Revenue opportunity
- Close Likelihood (0-100): Engagement probability
- Priority Tier: A (top), B (high), C (standard)
- Rating: 0-5 stars
- Review Count: 0-1000+
- Domain Rating: 0-100 (SEO authority)
- Has Website: Yes/No filter
- Has Email: Yes/No filter

**Market Intelligence**
- Market Types:
  - Wealthy Suburb Suppression
  - Incorporated City Penalty
  - Rapid Growth Market
  - Interstate Border Town
  - Fragmented Metropolitan
  - Immigrant/Ethnic Cluster
- Municipal Mismatch: Geographic algorithm penalties
- Wealth Score: Area affluence indicator
- Distance from Metro: Proximity to city center

**Exclusions**
- Exclude Chains
- Exclude Franchises
- Exclude Corporate entities

**Sorting Options**
- Impact Score (high/low)
- Close Likelihood (high/low)
- Deal Value (high/low)
- Date (newest/oldest/updated)

### How to use:
1. Click "More" button in filter bar
2. Expand Quality or Market sections
3. Adjust sliders for range filters
4. Check boxes for multi-select
5. Active filters show as badges
6. Click badge X to remove individual filter
7. Click "Clear all" to reset

**Filter Presets** (coming soon):
- Save custom filter combinations
- Quick access to common searches

**Pro Tips:**
- **Sweet Spot:** Impact ≥50 AND Close ≥50
- **Low-hanging fruit:** Close ≥70, any impact
- **High value:** Impact ≥70, Rating ≥4.5
- Use market type to target algorithm suppression
- Combine filters for precision targeting

---

## 5️⃣ SETTINGS & CONFIGURATION

### Settings Panel Access
**Who can access:** Master users only  
**Location:** Settings link in left navigation

---

### Appearance

**Theme Selection:**
- Light mode (default)
- Dark mode
- System (auto-detect OS preference)

**How it works:**
- Selection applies immediately
- Persists across sessions
- Syncs across devices when logged in

---

### Commission Defaults

**What it controls:** Global rates for new sales reps

**Settings:**
- **Default Commission (%):** One-time payment at close (default: 15%)
- **Default Residual (%):** Ongoing monthly commission (default: 5%)
- **Master Manager Fee ($):** Monthly management fee (default: $240)

**How it works:**
- Applied automatically to new reps
- Can be overridden per client
- Updates don't affect existing clients

---

### Feature Toggles

**Global on/off switches:**
- Content Studio (AI generation tools)
- Competitive Scanning (automated analysis)
- Voice Capture (SCRVNR brand voice)
- Bug Reporting (user feedback system)

**Use cases:**
- Disable features during maintenance
- Control feature access
- Gradual rollout to team

---

### Scanning Configuration

**Scan Frequency:** How often automated scans run (1-365 days)
- Default: 30 days
- Recommended: 30 days for active clients, 90 for stable

**Monthly Cost Limit:** Maximum API spend per month ($)
- Default: $100/month
- Prevents runaway costs
- Stops scans when limit reached

---

### Notifications

**Email Notifications:**
- Enable/disable all email alerts
- Master switch for notification system

**Task Assignment Alerts:**
- Get notified when tasks assigned to you
- Helps track responsibilities

**Scan Complete Alerts:**
- Notification when competitive scans finish
- Review results promptly

---

### API Key Management

**Supported Services:**
- **OpenAI:** AI content generation and analysis
- **Google:** Maps, Places, Search Console
- **SEMrush:** Keyword research and competitor analysis
- **Ahrefs:** Backlink analysis and domain rating

**Security Features:**
- Keys encrypted in database
- Only visible to master users
- Password-masked input fields
- Never logged or exposed in URLs

**How to add keys:**
1. Navigate to Settings → API Keys
2. Paste key into appropriate field
3. Click "Save Settings"
4. Test integration to verify

**Pro Tips:**
- Never share keys publicly
- Rotate keys periodically for security
- Monitor usage in service dashboards
- Set spending limits at provider level

---

## 🚀 QUICK START BY ROLE

### Sales Reps
1. Claim leads from Available column
2. Move through pipeline (Scheduled → Contacted → Won)
3. Use filters to find high-value targets
4. Track earnings in dashboard

### Master Managers
1. Review team performance daily
2. Monitor client health scores
3. Assign territories and compensation
4. Keep scans running for active clients
5. Configure settings for team

### Owners
1. Track company profitability
2. Review Bug Reports regularly
3. Manage API keys and costs
4. Configure global settings
5. Monitor team metrics

---

## 📞 GETTING HELP

**In-App Support:**
- Look for ? icons throughout app
- Hover for contextual tooltips
- Check this tutorial anytime

**Bug Reporting:**
- Click "Report Bug" button
- Include detailed description
- Auto-assigned to support team

**Questions:**
- Ask your manager
- Check Help menu
- Reference this guide

---

**Version 2.0 Complete!** 🎉  
All 13 features documented and ready for production.
