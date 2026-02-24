button + "Restore" button
// - Click restore → confirmation → calls restore API
// - Shows diff between current and selected version
// - Scrollable list with latest first
```

8. **Update** `src/components/content/ContentList.tsx`:
- Add "History" button to each content item
- Opens VersionHistoryDialog
- Shows version count badge if > 1 version

9. **Update** `src/components/content/EditContentDialog.tsx`:
- Add optional "Change Note" field
- Passed to API when saving
- Helps track why changes were made

#### Expected Files Created/Modified:
- `prisma/schema.prisma` (add ContentVersion model, update ClientContent)
- `src/app/api/content/[id]/route.ts` (modify PATCH to create versions)
- `src/app/api/content/[id]/versions/route.ts` (NEW)
- `src/app/api/content/[id]/restore/route.ts` (NEW)
- `src/components/content/VersionHistoryDialog.tsx` (NEW)
- `src/components/content/ContentList.tsx` (add History button)
- `src/components/content/EditContentDialog.tsx` (add change note field)

---

### 4. SCRVNR VOICE CAPTURE INTEGRATION ⭐ Priority 4

**Goal**: Allow sales reps and master managers to capture the client's brand voice from their website and use it as the default tone for content generation.

**Background**: 
- ClientProfile already has `voiceProfileId` field (currently unused)
- SCRVNR is David's voice synthesis system
- Captured voice should become the default tone option in all Content Studio generators

**Implementation Steps**:

#### Database (Already Ready)
```prisma
// ClientProfile already has:
voiceProfileId String? @map("voice_profile_id")
```

No schema changes needed - this field is ready to use!

#### API Endpoints

1. **Create** `src/app/api/clients/[id]/capture-voice/route.ts`:
```typescript
POST /api/clients/[id]/capture-voice
- Body: { websiteUrl?: string } // Optional, defaults to client's website
- Fetches content from client's website (homepage + key pages)
- Calls SCRVNR API to analyze writing style
- SCRVNR returns voice profile characteristics:
  {
    profileId: string,
    tonality: string,
    vocabulary: string[],
    sentenceStructure: string,
    characteristics: {
      formality: number, // 1-10
      enthusiasm: number,
      technicality: number,
      brevity: number
    }
  }
- Saves profileId to ClientProfile.voiceProfileId
- Returns voice profile summary
```

2. **Create** `src/app/api/clients/[id]/voice-profile/route.ts`:
```typescript
GET /api/clients/[id]/voice-profile
- Returns the stored voice profile from SCRVNR
- Includes tone description for UI display

DELETE /api/clients/[id]/voice-profile
- Removes voice profile (sets voiceProfileId to null)
- Used if client wants to reset to generic tones
```

3. **Update Content Generation APIs** to use voice profile:
```typescript
// In generate-blog, generate-social, generate-meta routes:
// If client has voiceProfileId, fetch voice profile from SCRVNR
// Include voice characteristics in Claude API prompt
// Example prompt addition:
`
Brand Voice Profile:
- Tonality: ${voiceProfile.tonality}
- Formality Level: ${voiceProfile.characteristics.formality}/10
- Key Vocabulary: ${voiceProfile.vocabulary.join(', ')}
- Sentence Structure: ${voiceProfile.sentenceStructure}

Please write in this exact style and tone.
`
```

#### SCRVNR Integration Service

4. **Create** `src/lib/scrvnr/voice-capture.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'

interface VoiceProfile {
  profileId: string
  tonality: string
  vocabulary: string[]
  sentenceStructure: string
  characteristics: {
    formality: number
    enthusiasm: number
    technicality: number
    brevity: number
  }
}

export async function captureVoiceFromWebsite(
  websiteUrl: string
): Promise<VoiceProfile> {
  // 1. Fetch website content (use existing web scraper or add cheerio)
  // 2. Extract text from key pages (homepage, about, blog posts)
  // 3. Call Claude API with SCRVNR-style analysis prompt
  // 4. Parse and return voice profile
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })
  
  // Scrape website content
  const websiteContent = await scrapeWebsiteContent(websiteUrl)
  
  // Analyze with Claude
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze the writing style and brand voice from this website content:

${websiteContent}

Provide a detailed voice profile in JSON format:
{
  "tonality": "brief description of overall tone",
  "vocabulary": ["key", "repeated", "industry", "terms"],
  "sentenceStructure": "description of typical sentence patterns",
  "characteristics": {
    "formality": 1-10,
    "enthusiasm": 1-10,
    "technicality": 1-10,
    "brevity": 1-10
  }
}

Return ONLY the JSON, no other text.`
    }]
  })
  
  // Parse JSON response
  const profile = JSON.parse(analysis.content[0].text)
  
  // Generate unique profile ID
  const profileId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    profileId,
    ...profile
  }
}

async function scrapeWebsiteContent(url: string): Promise<string> {
  // Use fetch + cheerio to extract text
  // Focus on: <p>, <h1-h6>, <article>, <main> tags
  // Limit to ~5000 words max
  // Return combined text
}

export async function getVoiceProfile(
  profileId: string
): Promise<VoiceProfile> {
  // In MVP: Store profiles in database as JSON
  // Later: Could integrate with actual SCRVNR service if it exists
  
  const profile = await prisma.clientProfile.findFirst({
    where: { voiceProfileId: profileId },
    select: { voiceProfileId: true }
  })
  
  // For MVP: Parse profileId to reconstruct characteristics
  // Or store full profile in metadata field
  // Return voice profile
}
```

#### UI Updates - Voice Capture Trigger

5. **Update** `src/components/clients/profile.tsx`:

Add "Capture Voice" button in client header area:
```typescript
// Near the client name/health score section
<Button
  variant="outline"
  size="sm"
  onClick={handleCaptureVoice}
  disabled={capturingVoice}
>
  {capturingVoice ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Analyzing...
    </>
  ) : client.voiceProfileId ? (
    <>
      <Check className="mr-2 h-4 w-4" />
      Voice Captured
    </>
  ) : (
    <>
      <Mic className="mr-2 h-4 w-4" />
      Capture Voice
    </>
  )}
</Button>

// Show voice profile badge if captured
{client.voiceProfileId && (
  <Badge variant="secondary" className="gap-1">
    <Sparkles className="h-3 w-3" />
    Custom Voice Profile
  </Badge>
)}
```

6. **Create** `src/components/clients/VoiceProfileDialog.tsx`:
```typescript
// Dialog that opens when "Capture Voice" clicked
// Shows:
// - "Analyzing [client website]..."
// - Progress indicator
// - On success: Voice profile summary
// - Tonality description
// - Key characteristics visualization
// - "Use This Profile" / "Recapture" buttons
// - "Remove Profile" option
```

#### UI Updates - Content Generators

7. **Update ALL generators** to use client voice as default:

In `BlogGenerator.tsx`, `SocialMediaGenerator.tsx`, `MetaDescriptionGenerator.tsx`:

```typescript
interface GeneratorProps {
  clientId: number
  clientVoiceProfile?: VoiceProfile | null  // NEW
  industry?: string
  onGenerated?: () => void
}

// Update tone selector:
<Select 
  value={tone} 
  onValueChange={setTone}
  defaultValue={clientVoiceProfile ? 'client-voice' : 'professional'}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {clientVoiceProfile && (
      <SelectItem value="client-voice">
        ⭐ {client.businessName}'s Voice (Default)
      </SelectItem>
    )}
    <SelectItem value="professional">Professional</SelectItem>
    <SelectItem value="conversational">Conversational</SelectItem>
    <SelectItem value="authoritative">Authoritative</SelectItem>
    <SelectItem value="friendly">Friendly</SelectItem>
    <SelectItem value="technical">Technical</SelectItem>
  </SelectContent>
</Select>

// When generating content:
if (tone === 'client-voice' && clientVoiceProfile) {
  // Include voice profile in API request
  body.voiceProfile = clientVoiceProfile
}
```

8. **Update** `src/components/content/ContentStudioTab.tsx`:

Fetch client voice profile and pass to generators:
```typescript
const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)

useEffect(() => {
  async function loadVoiceProfile() {
    if (!clientId) return
    const response = await fetch(`/api/clients/${clientId}/voice-profile`)
    if (response.ok) {
      const data = await response.json()
      setVoiceProfile(data.profile)
    }
  }
  loadVoiceProfile()
}, [clientId])

// Pass to generators:
<BlogGenerator
  clientId={clientId}
  clientVoiceProfile={voiceProfile}
  onGenerated={handleContentGenerated}
/>
```

#### Permission Control

9. **Add role check** to voice capture endpoint:

```typescript
// In capture-voice API route:
const session = await getServerSession(authOptions)
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { role: true }
})

// Only allow sales reps and master managers
if (!['sales-rep', 'master-manager', 'admin'].includes(user.role)) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  )
}
```

#### Expected Files Created/Modified:
- `src/app/api/clients/[id]/capture-voice/route.ts` (NEW)
- `src/app/api/clients/[id]/voice-profile/route.ts` (NEW)
- `src/lib/scrvnr/voice-capture.ts` (NEW - core voice analysis logic)
- `src/components/clients/VoiceProfileDialog.tsx` (NEW)
- `src/components/clients/profile.tsx` (add Capture Voice button)
- `src/components/content/ContentStudioTab.tsx` (fetch and pass voice profile)
- `src/components/clients/content/blog-generator.tsx` (add client-voice option)
- `src/components/content/SocialMediaGenerator.tsx` (add client-voice option)
- `src/components/content/MetaDescriptionGenerator.tsx` (add client-voice option)
- `src/app/api/content/generate-blog/route.ts` (use voice profile in prompt)
- `src/app/api/content/generate-social/route.ts` (use voice profile in prompt)
- `src/app/api/content/generate-meta/route.ts` (use voice profile in prompt)

#### Dependencies to Install:
```bash
npm install cheerio @types/cheerio
```

---

## Implementation Order

**Recommended sequence**:
1. **Content Scheduling** (2-3 hours) - Highest user value
2. **Batch Operations** (1-2 hours) - Quick UX win
3. **SCRVNR Voice Capture** (3-4 hours) - Differentiating feature
4. **Content Versioning** (3-4 hours) - Nice-to-have safety net

**Total Estimated Time**: 9-13 hours

---

## Environment Setup

**Required Environment Variables** (already configured):
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://...
```

**Current Working Directory**:
```bash
D:\Work\SEO-Services\ghm-dashboard
```

**Existing Components to Reference**:
- `src/components/content/ContentStudioTab.tsx` - Main container
- `src/components/content/ContentList.tsx` - Content display with edit/delete
- `src/components/content/ContentCalendar.tsx` - Calendar UI (needs API connection)
- `src/app/api/content/` - Existing API routes to follow patterns

**UI Component Library**:
- Uses shadcn/ui components
- For DatePicker: Use shadcn/ui Popover + Calendar pattern
- For selection: Use Checkbox component
- Follow existing patterns in ContentList.tsx

---

## Testing Checklist

After implementation, verify:

**Scheduling**:
- [ ] Can schedule content from generator with date picker
- [ ] Can schedule existing content from library
- [ ] Calendar shows scheduled content correctly
- [ ] Can publish scheduled content immediately
- [ ] Status filters work (Draft/Scheduled/Published)

**Batch Operations**:
- [ ] Selection mode toggles correctly
- [ ] Can select/deselect individual items
- [ ] Select All / Deselect All works
- [ ] Batch delete requires confirmation
- [ ] Deleted items removed from list
- [ ] Selection mode exits after deletion

**Voice Capture**:
- [ ] Capture Voice button visible to sales reps/managers only
- [ ] Voice analysis completes successfully
- [ ] Client-voice tone appears in all generators as default
- [ ] Generated content matches client's style
- [ ] Can remove voice profile
- [ ] Voice profile badge shows when active

**Versioning**:
- [ ] Each edit creates new version
- [ ] Version history displays correctly
- [ ] Can view old versions
- [ ] Can restore to previous version
- [ ] Change notes save properly

---

## Success Criteria

When complete, the Content Studio will have:
1. ✅ Full scheduling workflow with calendar integration
2. ✅ Efficient bulk content management
3. ✅ Client-specific brand voice capture and application
4. ✅ Complete edit history with rollback capability

This makes the Content Studio a **production-grade, enterprise-ready feature** that can compete with specialized content management platforms.

---

## Notes

- All code should follow existing patterns in the codebase
- Use TypeScript with proper typing
- Add error handling with toast notifications (Sonner)
- Include loading states for all async operations
- Follow the existing UI component patterns (shadcn/ui)
- Test thoroughly before committing
- Commit incrementally with clear messages

---

## Questions?

If you encounter issues:
1. Check existing API routes in `src/app/api/content/` for patterns
2. Reference ContentList.tsx for UI patterns
3. Look at prisma/schema.prisma for database structure
4. All dependencies should already be installed except cheerio (for web scraping)

Good luck! 🚀
