# End-to-End Application Flow

This document describes the complete user journey and data flows in the Voice Bedtime Tales application.

---

## Table of Contents

1. [User Journey Overview](#user-journey-overview)
2. [Step 1: Email Entry & Children List](#step-1-email-entry--children-list)
3. [Step 2: Voice Recording & Cloning](#step-2-voice-recording--cloning)
4. [Step 3: Child Details & Theme Selection](#step-3-child-details--theme-selection)
5. [Step 4: Preview Story Generation](#step-4-preview-story-generation)
6. [Step 5: Payment Process](#step-5-payment-process)
7. [Step 6: Full Story Generation](#step-6-full-story-generation)
8. [Step 7: Library Access](#step-7-library-access)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## User Journey Overview

```
Email Entry → Voice Recording → Child Details → Preview Story → Payment → Full Story → Library
     ↓              ↓                ↓              ↓             ↓           ↓          ↓
  Children      Voice Clone     Story Params   30-sec Audio   Stripe    10-min Audio  Albums
  List Fetch    (ElevenLabs)    Collection     (Gemini+TTS)   Checkout  (Full Flow)   Grouped
```

---

## Step 1: Email Entry & Children List

### User Action
User enters their email address and clicks "Continue"

### Frontend Component
**File**: `src/app/page.tsx` (lines 85-119)

**Component**: Home page `CreateStoryWizard`

### Flow

1. **User Input**: Email address entered in form field

2. **API Request**:
   ```typescript
   POST /api/children
   Body: { email: "parent@example.com" }
   ```

3. **Backend Processing** (`src/app/api/children/route.ts`):
   - Connect to MongoDB
   - Find user by email (case-insensitive): `User.findOne({ email: email.toLowerCase() })`
   - If user exists:
     - Fetch all stories: `Story.find({ userId: user._id }).sort({ createdAt: -1 })`
     - Extract unique children from stories
     - Aggregate by `childName` + `childAge`
     - Return list with story counts and interests

4. **API Response**:
   ```json
   {
     "success": true,
     "hasUser": true,
     "userId": "user_mongo_id",
     "hasVoice": true,
     "children": [
       {
         "childName": "Emma",
         "childAge": 5,
         "interests": "dinosaurs, dragons",
         "storyCount": 3,
         "lastStoryDate": "2025-01-14T10:30:00Z"
       }
     ]
   }
   ```

5. **UI Update**:
   - If children found: Display selection list
   - If no children or new user: Proceed to voice recording

### Database Collections Used
- **users**: Lookup by email
- **stories**: Extract children data

---

## Step 2: Voice Recording & Cloning

### User Action
User records their voice for 30-60 seconds

### Frontend Component
**File**: `src/components/voice/VoiceRecorder.tsx`

### Flow

1. **Recording**:
   - Use browser `MediaRecorder` API
   - Capture audio as WebM/MP3
   - Minimum 30 seconds required

2. **Upload to Storage**:
   ```typescript
   // Convert to Blob
   const audioBlob = new Blob(chunks, { type: "audio/webm" })

   // Upload to Cloudflare R2
   PUT /voice-samples/[filename].mp3
   ```

3. **Voice Cloning** (`src/app/api/voice/clone/route.ts`):
   ```typescript
   POST /api/voice/clone
   Body: { sampleUrl: "https://r2.dev/sample.mp3", email: "..." }
   ```

4. **Backend Processing**:
   - Fetch audio from R2
   - Convert to Buffer
   - Call ElevenLabs API:
     ```typescript
     POST https://api.elevenlabs.io/v1/voices/add
     FormData: {
       name: "Parent Name",
       files: [audioBuffer],
       description: "Voice Bedtime Tales - Parent Voice"
     }
     ```

5. **Store Voice ID**:
   - Update or create User document
   - Save `elevenlabsVoiceId` field
   ```typescript
   User.findOneAndUpdate(
     { email },
     { elevenlabsVoiceId: voiceId },
     { upsert: true }
   )
   ```

6. **Response**:
   ```json
   {
     "success": true,
     "voiceId": "elevenlabs_voice_id_abc123"
   }
   ```

### External Services
- **Cloudflare R2**: Audio storage
- **ElevenLabs API**: Voice cloning

---

## Step 3: Child Details & Theme Selection

### User Action
Enters child information and selects story theme

### Form Fields
- Child's name (required)
- Child's age (2-10 years)
- Child's interests (e.g., "dinosaurs, space, dragons")
- Story theme selection:
  - Adventure
  - Animals
  - Space
  - Ocean
  - Fairy Tales
  - Dinosaurs

### Data Storage
Form data stored in component state, sent to API in next step

---

## Step 4: Preview Story Generation

### User Action
Clicks "Generate Preview Story"

### Frontend Component
**File**: `src/app/page.tsx` (preview generation handler)

### Complete Flow

```
User Clicks "Generate Preview"
    ↓
POST /api/story/preview
    ↓
┌─────────────────────────────────────────────┐
│ 1. VALIDATE & PREPARE                       │
│    - Check email, voiceId, child details    │
│    - Find or create User document           │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 2. GENERATE STORY TEXT (Gemini)             │
│    src/lib/gemini.ts:generatePreviewStory() │
│                                              │
│    Request:                                  │
│    POST https://generativelanguage          │
│         .googleapis.com/v1beta/models/      │
│         gemini-2.0-flash:generateContent    │
│                                              │
│    Prompt:                                   │
│    "Create 30-second preview (~100 words)   │
│     for [childName], age [childAge]         │
│     interests: [interests]                  │
│     theme: [theme]                          │
│     Must end on CLIFFHANGER"                │
│                                              │
│    Response:                                 │
│    {                                         │
│      "title": "Story Title",                │
│      "story": "[softly] Text with tags...", │
│      "backgroundMusicPrompt": "gentle..."   │
│    }                                         │
│                                              │
│    Duration: ~2-4 seconds                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 3. TEXT-TO-SPEECH (ElevenLabs)              │
│    src/lib/elevenlabs.ts:textToSpeech()     │
│                                              │
│    Request:                                  │
│    POST https://api.elevenlabs.io/v1/       │
│         text-to-speech/[voiceId]            │
│                                              │
│    Body:                                     │
│    {                                         │
│      "text": "[softly] Story text...",      │
│      "model_id": "eleven_v3",               │
│      "voice_settings": {                    │
│        "stability": 0.5,                    │
│        "similarity_boost": 0.75,            │
│        "style": 0.4,                        │
│        "speed": 0.7  // SLOWEST             │
│      }                                       │
│    }                                         │
│                                              │
│    Response: MP3 audio buffer                │
│    Duration: ~3-5 seconds                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 4. GET BACKGROUND MUSIC                     │
│    src/lib/music.ts:getBackgroundMusic()    │
│                                              │
│    Option A: Mubert AI (if API key set)     │
│    POST https://api-b2b.mubert.com/v2/      │
│         RecordTrackTTM                       │
│    {                                         │
│      "prompt": "[musicPrompt] calm lullaby",│
│      "duration": 60,                         │
│      "intensity": "low"                      │
│    }                                         │
│                                              │
│    Option B: Curated Library (fallback)     │
│    - Score all tracks by theme/keywords     │
│    - Select best match from /public/music/  │
│    - Return: "/music/lullaby-piano.mp3"     │
│                                              │
│    Duration: ~1-3 seconds                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 5. UPLOAD NARRATION TO R2                   │
│    src/lib/blob.ts:uploadAudio()            │
│                                              │
│    Upload narration MP3 to:                 │
│    voice-stories/stories/preview/           │
│    [childName]_[theme]_preview_[voiceId]_   │
│    [timestamp].mp3                           │
│                                              │
│    Returns: Public URL                       │
│    Duration: ~1-2 seconds                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 6. MIX AUDIO (FFmpeg)                       │
│    src/lib/audioMixer.ts:                   │
│    mixNarrationWithMusic()                  │
│                                              │
│    Local Mode (Development):                │
│    - Run FFmpeg via child_process           │
│    - Build filter complex                   │
│    - Mix narration + music                  │
│                                              │
│    Remote Mode (Production):                │
│    POST [FFMPEG_API_URL]/api/mix            │
│    {                                         │
│      "narrationUrl": "https://...",         │
│      "musicUrl": "https://...",             │
│      "musicVolume": 0.25,                   │
│      "ducking": true,                       │
│      "duckingAmount": 0.5,                  │
│      "fadeInDuration": 1,                   │
│      "fadeOutDuration": 2                   │
│    }                                         │
│                                              │
│    FFmpeg Filter:                            │
│    - Voice: lowpass, echo, dreamy effects   │
│    - Music: loop, trim, fade in/out         │
│    - Sidechain: compress music when voice   │
│    - Output: MP3, 192kbps, stereo           │
│                                              │
│    Duration: ~5-15 seconds                   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 7. UPLOAD FINAL AUDIO TO R2                 │
│    Upload mixed MP3 to R2                   │
│    Returns: Public preview URL               │
│    Duration: ~1-2 seconds                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 8. SAVE TO DATABASE                         │
│    Create Story document:                   │
│    {                                         │
│      userId: ObjectId,                      │
│      voiceId: "elevenlabs_id",              │
│      childName: "Emma",                     │
│      childAge: 5,                            │
│      interests: "dinosaurs",                │
│      theme: "adventure",                    │
│      previewText: "Story text...",          │
│      previewUrl: "https://r2.dev/...",      │
│      backgroundMusicPrompt: "gentle...",    │
│      musicSource: "library",                │
│      status: "preview",                     │
│      createdAt: Date                         │
│    }                                         │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 9. RETURN RESPONSE                          │
│    {                                         │
│      "success": true,                        │
│      "previewUrl": "https://...",           │
│      "storyId": "story_mongo_id"            │
│    }                                         │
└─────────────────────────────────────────────┘
    ↓
User Hears 30-Second Preview with Music
```

### Total Processing Time
- **Gemini**: 2-4 seconds
- **ElevenLabs**: 3-5 seconds
- **Music**: 1-3 seconds
- **FFmpeg Mix**: 5-15 seconds
- **Storage**: 2-3 seconds
- **Total**: ~15-30 seconds

---

## Step 5: Payment Process

### User Action
Clicks "Generate Full Story" after preview

### Flow

1. **Create Checkout Session** (`src/app/api/checkout/route.ts`):
   ```typescript
   POST /api/checkout
   Body: { storyId: "story_mongo_id" }
   ```

2. **Stripe Session Creation**:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ["card"],
     line_items: [
       {
         price: process.env.STRIPE_PRICE_ID,
         quantity: 1,
       },
     ],
     mode: "payment",
     success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${APP_URL}/preview/${storyId}`,
     metadata: { storyId }
   });
   ```

3. **Update Story**:
   ```typescript
   Story.findByIdAndUpdate(storyId, {
     stripeSessionId: session.id,
     status: "paid"
   });
   ```

4. **Redirect to Stripe**: User completes payment

5. **Webhook Handler** (`src/app/api/webhook/route.ts`):
   - Receives `checkout.session.completed` event
   - Verifies webhook signature
   - Updates story status to "paid"
   - Triggers full story generation (if not using background job)

### Payment Bypass (Development)
If `BYPASS_PAYMENT=true` in `.env.local`:
- Skip Stripe
- Immediately mark as "paid"
- Generate full story

---

## Step 6: Full Story Generation

### Trigger
- After successful payment
- Or after payment bypass

### Flow

```
Payment Confirmed
    ↓
POST /api/story/full
Body: { storyId: "..." }
    ↓
┌─────────────────────────────────────────────┐
│ 1. VERIFY PAYMENT                           │
│    - Check story status is "paid"           │
│    - Or BYPASS_PAYMENT is enabled           │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 2. UPDATE STATUS                            │
│    Story.status = "generating"              │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 3. GENERATE FULL STORY (Gemini)             │
│    src/lib/gemini.ts:generateFullStory()    │
│                                              │
│    Prompt:                                   │
│    "Create 10-minute bedtime story          │
│     1400-1600 words (NON-NEGOTIABLE)        │
│     for [childName], age [childAge]         │
│     interests: [interests]                  │
│     theme: [theme]                          │
│                                              │
│     Structure:                               │
│     - HOOK (5%)                             │
│     - SETUP (15%)                           │
│     - ADVENTURE (50%)                       │
│     - CLIMAX (15%)                          │
│     - RESOLUTION (10%)                      │
│     - WIND-DOWN (5%)"                       │
│                                              │
│    Duration: ~5-10 seconds                   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 4. TEXT-TO-SPEECH (ElevenLabs)              │
│    Same settings as preview                 │
│    But 1400-1600 words input                │
│                                              │
│    Duration: ~30-60 seconds                  │
│    (Processing long text)                    │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 5. GET BACKGROUND MUSIC                     │
│    Same as preview, but 600 seconds         │
│    (10-minute duration)                      │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 6. MIX AUDIO (FFmpeg)                       │
│    Same process as preview                  │
│    But longer duration:                     │
│    - fadeInDuration: 2 seconds              │
│    - fadeOutDuration: 3 seconds             │
│    - Total: ~600 seconds                    │
│                                              │
│    Duration: ~20-45 seconds                  │
│    (Mixing 10-minute audio)                  │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 7. UPLOAD TO R2                             │
│    voice-stories/stories/full/              │
│    [childName]_[theme]_full_[voiceId]_      │
│    [timestamp].mp3                           │
│                                              │
│    Duration: ~5-10 seconds                   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 8. UPDATE DATABASE                          │
│    Story.update({                           │
│      storyText: "Full story...",            │
│      fullAudioUrl: "https://...",           │
│      status: "complete",                    │
│      hasMusicMixed: true                    │
│    })                                        │
└─────────────────────────────────────────────┘
    ↓
User Can Listen to Full 10-Minute Story
```

### Total Processing Time
- **Gemini**: 5-10 seconds
- **ElevenLabs**: 30-60 seconds
- **Music**: 1-3 seconds
- **FFmpeg Mix**: 20-45 seconds
- **Storage**: 5-10 seconds
- **Total**: ~60-120 seconds (1-2 minutes)

---

## Step 7: Library Access

### User Action
Clicks "Library" or navigates to `/library`

### Frontend Component
**File**: `src/components/library/LibraryView.tsx`

### Flow: Album List

1. **API Request**:
   ```typescript
   GET /api/library/albums
   ```

2. **Backend Processing** (`src/app/api/library/albums/route.ts`):

   **MongoDB Aggregation Pipeline**:
   ```javascript
   Story.aggregate([
     // Match completed stories with audio
     { $match: {
       status: "complete",
       fullAudioUrl: { $exists: true, $ne: null }
     }},

     // Join with users to get voice IDs
     { $lookup: {
       from: "users",
       localField: "userId",
       foreignField: "_id",
       as: "user"
     }},

     // Compute effective voice ID
     { $addFields: {
       effectiveVoiceId: {
         $ifNull: ["$voiceId", "$user.elevenlabsVoiceId"]
       }
     }},

     // Filter out stories without voice
     { $match: {
       effectiveVoiceId: { $exists: true, $ne: null }
     }},

     // Group by voice ID
     { $group: {
       _id: "$effectiveVoiceId",
       storyCount: { $sum: 1 },
       latestStoryDate: { $max: "$createdAt" },
       coverStories: { $push: {
         _id: "$_id",
         theme: "$theme",
         childName: "$childName"
       }},
       ownerEmail: { $first: "$user.email" }
     }},

     // Take first 4 stories for cover art
     { $project: {
       voiceId: "$_id",
       storyCount: 1,
       latestStoryDate: 1,
       coverStories: { $slice: ["$coverStories", 4] },
       ownerEmail: 1
     }},

     // Sort by latest story
     { $sort: { latestStoryDate: -1 } }
   ])
   ```

3. **Response**:
   ```json
   {
     "albums": [
       {
         "voiceId": "elevenlabs_voice_id_123",
         "ownerEmail": "parent@example.com",
         "storyCount": 8,
         "latestStoryDate": "2025-01-14T10:30:00Z",
         "coverStories": [
           { "_id": "story1", "theme": "adventure", "childName": "Emma" },
           { "_id": "story2", "theme": "ocean", "childName": "Emma" },
           { "_id": "story3", "theme": "space", "childName": "Liam" },
           { "_id": "story4", "theme": "animals", "childName": "Emma" }
         ]
       }
     ]
   }
   ```

### Flow: Album Details

1. **User Clicks Album**:
   ```typescript
   GET /api/library/albums/[voiceId]
   ```

2. **Backend Processing** (`src/app/api/library/albums/[voiceId]/route.ts`):

   **Query 1**: Direct voiceId stories
   ```typescript
   Story.find({
     voiceId: voiceId,
     status: "complete",
     fullAudioUrl: { $exists: true, $ne: null }
   }).sort({ createdAt: -1 })
   ```

   **Query 2**: Find users with this voiceId
   ```typescript
   User.find({ elevenlabsVoiceId: voiceId })
   ```

   **Query 3**: Stories linked to those users
   ```typescript
   Story.find({
     userId: { $in: userIds },
     voiceId: { $exists: false },
     status: "complete",
     fullAudioUrl: { $exists: true, $ne: null }
   }).sort({ createdAt: -1 })
   ```

   **Combine & Deduplicate**: Merge all stories, remove duplicates by `_id`

3. **Response**:
   ```json
   {
     "voiceId": "elevenlabs_voice_id_123",
     "ownerEmail": "parent@example.com",
     "storyCount": 8,
     "stories": [
       {
         "_id": "story_id_1",
         "childName": "Emma",
         "childAge": 5,
         "interests": "dinosaurs",
         "theme": "adventure",
         "fullAudioUrl": "https://r2.dev/...",
         "status": "complete",
         "createdAt": "2025-01-14T10:30:00Z"
       }
     ]
   }
   ```

4. **UI Display**:
   - Grid of story cards
   - Click to play in audio player
   - Continuous playback queue

---

## Data Flow Diagrams

### Preview Story Generation

```
┌──────────┐
│  User    │
│  Input   │
└────┬─────┘
     │ Email, Child Details, Theme
     ↓
┌────────────────┐
│  API Routes    │
│  /api/story/   │
│  preview       │
└───┬────────────┘
    │
    ├─→ Gemini API ──→ Story Text + Music Prompt
    │
    ├─→ ElevenLabs ──→ Narration MP3
    │
    ├─→ Mubert/Library → Background Music MP3
    │
    ├─→ FFmpeg API ──→ Mixed Audio MP3
    │
    └─→ MongoDB ────→ Story Record
         │
         ↓
    Cloudflare R2 ──→ Public URL
         │
         ↓
    ┌─────────┐
    │ Frontend│
    │ Player  │
    └─────────┘
```

### Library Data Flow

```
┌──────────────┐
│ User Visits  │
│ /library     │
└──────┬───────┘
       │
       ↓
┌────────────────────┐
│ GET /api/library/  │
│ albums             │
└─────┬──────────────┘
      │
      ↓
┌───────────────────────────┐
│ MongoDB Aggregation       │
│ - Match complete stories  │
│ - Join users table        │
│ - Group by voiceId        │
│ - Count stories           │
│ - Get cover images        │
└─────┬─────────────────────┘
      │
      ↓
┌───────────────────┐
│ Albums Array      │
│ [{voiceId, count, │
│   covers, email}] │
└─────┬─────────────┘
      │
      ↓
┌──────────────┐     Click Album     ┌─────────────────┐
│ AlbumGrid    │ ──────────────────→ │ GET /api/library│
│ Component    │                     │ /albums/[id]    │
└──────────────┘                     └────┬────────────┘
                                          │
                                          ↓
                                    ┌──────────────────┐
                                    │ Fetch all stories│
                                    │ for this voiceId │
                                    └────┬─────────────┘
                                         │
                                         ↓
                                    ┌──────────────┐
                                    │ Stories List │
                                    │ with audio   │
                                    │ URLs         │
                                    └────┬─────────┘
                                         │
                                         ↓
                                    ┌──────────────┐
                                    │ Audio Player │
                                    │ Queue        │
                                    └──────────────┘
```

---

## Database Schema Reference

### User Model
```typescript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  elevenlabsVoiceId: String (optional),
  stripeCustomerId: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Story Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, optional),
  voiceId: String (optional, direct voice ID),
  childName: String (required),
  childAge: Number (required),
  interests: String (required),
  theme: String,
  customPrompt: String,

  // Story content
  previewText: String,
  storyText: String,

  // Audio URLs
  previewUrl: String,
  fullAudioUrl: String,

  // Music
  backgroundMusicPrompt: String,
  musicTrackId: String,
  musicSource: "library" | "mubert",
  hasMusicMixed: Boolean,
  musicVolume: Number,

  // Status
  status: "preview" | "paid" | "generating" | "complete" | "failed",

  // Payment
  stripeSessionId: String,

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

### Story Generation Failures

1. **Gemini API Quota Exceeded**:
   - Fallback to mock stories
   - Function: `getMockPreviewStory()` or `getMockFullStory()`

2. **ElevenLabs API Error**:
   - Return error to user
   - Suggest re-recording voice or trying again

3. **FFmpeg Processing Error**:
   - Try local FFmpeg if remote fails
   - If both fail, return narration without music

4. **Payment Webhook Delay**:
   - Story status remains "paid"
   - User can retry full story generation from preview page

---

## Performance Optimizations

1. **Parallel Processing**: Music fetch and TTS run simultaneously when possible
2. **Caching**: MongoDB connection cached globally
3. **Streaming**: Audio uploads stream directly to R2
4. **Background Jobs**: Full story generation can run async (webhook-triggered)
5. **CDN**: R2 public URLs cached for 1 year

---

**Last Updated**: January 14, 2026
