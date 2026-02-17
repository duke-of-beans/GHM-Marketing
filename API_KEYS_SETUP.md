# API KEYS ADDED - CONFIGURATION GUIDE
**Date:** February 17, 2026  
**Status:** ✅ Local environment updated  
**Next:** Add to Vercel for production

---

## ✅ API KEYS ADDED TO LOCAL

### Keys Added to .env.local

1. **OUTSCRAPER_API_KEY**
   - Value: `[REDACTED - See .env.local]`
   - Purpose: Google Maps business discovery and data enrichment
   - Used by: Discovery search feature

2. **ANTHROPIC_API_KEY**
   - Value: `[REDACTED - See .env.local]`
   - Purpose: Claude AI for AI-powered features
   - Used by: Future AI features (content generation, analysis, etc.)

---

## 🚀 ADD TO VERCEL FOR PRODUCTION

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select: GHM Marketing project

2. **Navigate to Settings**
   - Click "Settings" tab
   - Select "Environment Variables" from left menu

3. **Add OUTSCRAPER_API_KEY**
   - Click "Add New" button
   - Name: `OUTSCRAPER_API_KEY`
   - Value: [Copy from .env.local file]
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

4. **Add ANTHROPIC_API_KEY**
   - Click "Add New" button
   - Name: `ANTHROPIC_API_KEY`
   - Value: [Copy from .env.local file]
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

5. **Redeploy to Apply**
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Select "Redeploy"
   - Confirm redeployment

---

## 🔧 WHAT THESE KEYS ENABLE

### Outscraper API
**Current Feature:**
- ✅ Discovery search (Find Leads page)
- ✅ Google Maps business data
- ✅ Reviews, ratings, contact info
- ✅ Automated lead qualification

**How It Works:**
```
User searches for "plumber in Austin"
    ↓
API calls Outscraper
    ↓
Returns businesses with:
- Name, address, phone
- Rating, review count
- Website, category
- Quality score
    ↓
Import to sales pipeline
```

### Claude API (Anthropic)
**Future Features (Not Yet Implemented):**
- 🔮 AI content generation
- 🔮 Automated SEO analysis
- 🔮 Smart competitor insights
- 🔮 Report generation
- 🔮 Client communication drafts
- 🔮 Task recommendations

**Potential Uses:**
```
1. Content Brief Generator
   - Auto-generate SEO content briefs
   - Keyword research + outline
   
2. Competitor Analysis
   - Analyze competitor websites
   - Identify gaps and opportunities
   
3. Report Enhancement
   - AI-generated insights
   - Natural language summaries
   
4. Email Drafts
   - Client updates
   - Proposal templates
```

---

## 💰 COST MANAGEMENT

### Outscraper Pricing
- **Model:** Pay-as-you-go
- **Cost:** ~$5 per 1,000 searches
- **Free Tier:** First $5 credit
- **Monitor:** https://app.outscraper.com/dashboard

**Typical Usage:**
- Discovery search: ~$0.005 per business
- 100 searches = ~$0.50
- 1,000 searches = ~$5

### Claude API Pricing
- **Model:** Claude Sonnet 4.5
- **Input:** $3 per million tokens
- **Output:** $15 per million tokens
- **Monitor:** https://console.anthropic.com/

**Typical Usage:**
- Content brief (1,000 tokens): ~$0.02
- Report generation (5,000 tokens): ~$0.10
- Analysis (10,000 tokens): ~$0.20

---

## 🔐 SECURITY BEST PRACTICES

### ✅ Done Right
1. ✅ Keys in .env.local (not committed to git)
2. ✅ .env.local in .gitignore
3. ✅ Separate keys for development/production

### ⚠️ Important Notes
- **Never commit** .env.local to git
- **Never expose** keys in client-side code
- **Always use** server-side API routes
- **Rotate keys** if accidentally exposed

### If Keys Are Compromised
**Outscraper:**
1. Go to https://app.outscraper.com/
2. Navigate to API Keys
3. Generate new key
4. Update .env.local and Vercel

**Claude API:**
1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Delete compromised key
4. Create new key
5. Update .env.local and Vercel

---

## 📝 ENVIRONMENT VARIABLE CHECKLIST

### Local Development (.env.local)
- [x] DATABASE_URL (Neon Postgres)
- [x] DIRECT_URL (Neon Postgres)
- [x] NEXTAUTH_SECRET
- [x] NEXTAUTH_URL
- [x] OUTSCRAPER_API_KEY ← **NEW**
- [x] ANTHROPIC_API_KEY ← **NEW**

### Production (Vercel)
- [ ] OUTSCRAPER_API_KEY ← **TODO: Add to Vercel**
- [ ] ANTHROPIC_API_KEY ← **TODO: Add to Vercel**

**Note:** Database and NextAuth variables already in Vercel

---

## 🧪 TESTING THE KEYS

### Test Outscraper (Discovery Search)
1. Navigate to "Find Leads" page
2. Enter search criteria:
   - Business Type: "plumber"
   - Location: "Austin, TX"
   - Min Reviews: 10
   - Min Rating: 3.5
3. Click "Search Maps"
4. Should return real businesses
5. Import a few leads to test

### Test Claude API (Future)
Currently not implemented. When features are added:
1. Test content generation
2. Monitor API usage
3. Check response quality

---

## 📊 MONITORING & LIMITS

### Outscraper Dashboard
**Monitor:**
- API usage statistics
- Remaining credits
- Request history
- Error rates

**Access:** https://app.outscraper.com/dashboard

### Claude API Console
**Monitor:**
- Token usage (input/output)
- Request counts
- Cost breakdown
- Error logs

**Access:** https://console.anthropic.com/

---

## ✅ NEXT STEPS

### Immediate (Required)
1. **Add keys to Vercel**
   - Follow steps above
   - Redeploy to apply

### Optional (Recommended)
1. **Test Discovery search**
   - Verify Outscraper works
   - Import sample leads

2. **Set up alerts**
   - Outscraper: Email when credits low
   - Claude: Budget limits in console

3. **Document usage**
   - Track monthly API costs
   - Monitor search patterns
   - Optimize as needed

---

## 🎯 COMPLETION STATUS

**Local Environment:** ✅ Complete  
**Vercel Production:** ⏳ Pending (add keys manually)  
**Testing:** ⏳ Pending (after Vercel setup)

---

**File Updated:** D:\Work\SEO-Services\ghm-dashboard\.env.local  
**Keys Added:** 2 (Outscraper + Claude API)  
**Status:** Ready for production after Vercel configuration
