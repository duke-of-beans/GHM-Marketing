# TeamFeed Multimedia Blueprint
**Status:** SPEC — not yet implemented  
**Scope:** Image/file upload, emoji reactions, GIF support  
**Target file:** `src/components/team-feed/TeamFeed.tsx` + supporting infra  
**Fresh session recommended:** Yes — DB migration + storage integration + 3 new components

---

## 1. What We're Building

Three capabilities added to every message and reply in the TeamFeed:

| Feature | Description |
|---|---|
| **Image / file upload** | Attach images or files to any message. Rendered inline (images) or as download links (files). |
| **Emoji reactions** | React to any message with an emoji. Counts shown; hover shows who reacted. |
| **GIF support** | Search and insert animated GIFs via Tenor API. Rendered inline like images. |

---

## 2. Database Schema Changes

### New model: `TeamMessageAttachment`

```prisma
model TeamMessageAttachment {
  id          Int      @id @default(autoincrement())
  messageId   Int      @map("message_id")
  message     TeamMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  type        String   // "image" | "file" | "gif"
  url         String   // Vercel Blob URL (images/files) or Tenor CDN URL (GIFs)
  filename    String?  // Original filename for files
  mimeType    String?  // e.g. "image/jpeg", "application/pdf"
  sizeBytes   Int?     // File size for display
  width       Int?     // Image/GIF dimensions for aspect ratio rendering
  height      Int?

  createdAt   DateTime @default(now()) @map("created_at")

  @@index([messageId])
  @@map("team_message_attachments")
}
```

### New model: `TeamMessageReaction`

```prisma
model TeamMessageReaction {
  id        Int      @id @default(autoincrement())
  messageId Int      @map("message_id")
  message   TeamMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  userId    Int      @map("user_id")
  user      User     @relation("MessageReactions", fields: [userId], references: [id], onDelete: Cascade)

  emoji     String   // Unicode emoji character e.g. "👍"

  createdAt DateTime @default(now()) @map("created_at")

  @@unique([messageId, userId, emoji])  // one of each emoji per user per message
  @@index([messageId])
  @@map("team_message_reactions")
}
```

### TeamMessage model additions

```prisma
// Add to existing TeamMessage model:
attachments  TeamMessageAttachment[]
reactions    TeamMessageReaction[]
```

### User model additions

```prisma
// Add to existing User model:
messageReactions  TeamMessageReaction[] @relation("MessageReactions")
```

---

## 3. Storage: Vercel Blob

Images and files upload to **Vercel Blob** (`@vercel/blob`). GIFs are Tenor CDN URLs — never uploaded, just stored as references.

**Why Blob:** Already on Vercel, free tier covers usage, automatic CDN, no extra service setup.

**Upload limits:**
- Images: 10MB max, accept `image/*`
- Files: 20MB max, accept common office/doc/pdf types
- GIFs: no upload — URL only

**Env var needed:** `BLOB_READ_WRITE_TOKEN` (already in Vercel dashboard under Storage > Blob)

---

## 4. API Changes

### `POST /api/team-messages` (extend existing)

Add `attachments` field to request body:

```typescript
{
  content: string,
  // ... existing fields ...
  attachments?: Array<{
    type: "image" | "file" | "gif"
    url: string
    filename?: string
    mimeType?: string
    sizeBytes?: number
    width?: number
    height?: number
  }>
}
```

After inserting the message, create `TeamMessageAttachment` rows in the same transaction.

### `GET /api/team-messages` (extend existing)

Include attachments and reactions in the select:

```typescript
select: {
  // ... existing fields ...
  attachments: { orderBy: { createdAt: 'asc' } },
  reactions: {
    include: { user: { select: { id: true, name: true } } }
  }
}
```

### `POST /api/team-messages/upload` (NEW)

Handles file/image upload to Vercel Blob before message submission.

```typescript
// Request: multipart/form-data with file
// Response:
{
  url: string       // Blob CDN URL
  filename: string
  mimeType: string
  sizeBytes: number
  width?: number    // populated for images
  height?: number
}
```

Implementation:
```typescript
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const blob = await put(file.name, file, { access: 'public' })
  // get dimensions if image via sharp or sizeOf
  return NextResponse.json({ url: blob.url, ... })
}
```

### `POST /api/team-messages/[id]/react` (NEW)

Toggle an emoji reaction on a message.

```typescript
// Request: { emoji: string }
// Behavior: if reaction exists for this user+emoji -> delete it (toggle off)
//           if not -> create it
// Response: { added: boolean, emoji: string, count: number }
```

---

## 5. Component Architecture

### New components to create

```
src/components/team-feed/
  MediaUploadButton.tsx     # Image/file picker + upload-to-blob logic
  GifPicker.tsx             # Tenor search + grid picker
  EmojiPicker.tsx           # Emoji palette (hand-rolled shortlist recommended for v1)
  AttachmentPreview.tsx     # Staged attachment preview before send
  AttachmentRenderer.tsx    # Render attachments inside a posted message
  ReactionBar.tsx           # Reaction display + add-reaction button
```

### MediaUploadButton

- Hidden `<input type="file">` triggered by a button
- On file selected: POST to `/api/team-messages/upload`
- Returns staged attachment object to parent via `onAttached(attachment)` callback
- Shows upload progress (simple spinner)
- Accepts prop `accept`: `"image/*"` or `"*"` depending on context

### GifPicker

- Popover/dialog triggered by GIF button
- Debounced search input → GET `https://tenor.googleapis.com/v2/search?q=...&key=TENOR_KEY&limit=20`
- Grid of GIF thumbnails (use `media_formats.tinygif.url` for thumbnail, `media_formats.gif.url` for full)
- On select: calls `onGifSelected({ url, width, height })` — no upload
- Env var: `NEXT_PUBLIC_TENOR_API_KEY` (free, register at tenor.com/gifapi)

### EmojiPicker

Two options ranked:

**Option A (recommended): emoji-mart**
`npm install @emoji-mart/react @emoji-mart/data`
Drop-in Popover with full emoji set, search, skin tones. ~50KB gzipped.

**Option B: Hand-rolled shortlist**
A 30-emoji palette covering the common reactions (👍 ❤️ 😂 🎉 🔥 👀 etc.) — zero dependency, trivial to build, covers 90% of use cases.

**Recommendation: Option B for v1** — keeps bundle lean, matches professional context. Upgrade to emoji-mart later if needed.

### AttachmentPreview (staged, before send)

Shown in ComposeMessage after attachment is selected/uploaded:
- Image: thumbnail preview with remove button
- File: icon + filename + size with remove button
- GIF: animated preview with remove button

### AttachmentRenderer (in posted message)

Renders `message.attachments[]` below message text:
- Images/GIFs: `<img>` with max-width constraint + lightbox on click (shadcn Dialog)
- Files: icon + filename + size + download link

### ReactionBar

Renders below message content. Two zones:
1. **Existing reactions:** Grouped by emoji, count shown, tooltip on hover lists who reacted. Click to toggle your own.
2. **Add reaction:** Small `+` button opens EmojiPicker popover.

---

## 6. ComposeMessage Changes

New toolbar row between textarea and send bar:

```
[ 📷 Image ]  [ 📎 File ]  [ GIF ]  [ 😊 Emoji ]
```

- Image/File → opens MediaUploadButton
- GIF → opens GifPicker
- Emoji → inserts character at cursor position in textarea (not a reaction)
- Selected attachments shown in AttachmentPreview above send bar
- Attachments held in `stagedAttachments[]` state, included in POST body on send

---

## 7. MessageRow Changes

Add below message text, before reply/expand row:

1. `AttachmentRenderer` — renders if `msg.attachments.length > 0`
2. `ReactionBar` — always present (empty state shows just the `+` button)

---

## 8. Type Changes

Extend `TeamMessageData` in `TeamFeed.tsx`:

```typescript
type MessageAttachment = {
  id: number
  type: "image" | "file" | "gif"
  url: string
  filename?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  width?: number | null
  height?: number | null
}

type MessageReaction = {
  id: number
  emoji: string
  user: { id: number; name: string }
}

// Add to TeamMessageData:
attachments: MessageAttachment[]
reactions: MessageReaction[]
```

---

## 9. Dependencies to Install

```bash
npm install @vercel/blob
# Optional (Option A emoji picker only):
npm install @emoji-mart/react @emoji-mart/data
```

---

## 10. Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard + `.env.local` | Under Storage > Blob |
| `NEXT_PUBLIC_TENOR_API_KEY` | `.env.local` | Free from tenor.com/gifapi |

---

## 11. Migration Order

1. Add Prisma models (TeamMessageAttachment, TeamMessageReaction)
2. Run `npx prisma migrate dev --name add_teamfeed_multimedia`
3. Install deps (@vercel/blob, optionally emoji-mart)
4. Create `/api/team-messages/upload` route
5. Create `/api/team-messages/[id]/react` route
6. Extend existing GET/POST `/api/team-messages` routes
7. Build MediaUploadButton, GifPicker, EmojiPicker
8. Build AttachmentPreview, AttachmentRenderer, ReactionBar
9. Wire into ComposeMessage and MessageRow
10. Test: send image, send GIF, react to message, reply with file

---

## 12. Scope Estimate

| Area | Complexity |
|---|---|
| DB + migration | Low |
| Upload API + Blob | Low |
| Tenor GIF picker | Low |
| Emoji picker (Option B) | Low |
| Attachment rendering | Medium |
| Reaction toggle + bar | Medium |
| Compose toolbar integration | Medium |
| **Total** | **~1 focused session** |

---

*Blueprint authored: February 2026*
*Next step: open fresh session, load this file, execute migration order section 11*
