# Voice Bedtime Tales - Implementation Guide

**Last Updated:** January 2, 2026

## Project Overview

Parents submit child details → Upload voice sample → Get 30-sec preview → Pay (or bypass) → Receive full story narrated in their cloned voice.

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Next.js 15 App | ✅ Complete | Tailwind v4, TypeScript |
| MongoDB Models | ✅ Complete | User, Story schemas |
| Voice Recording | ✅ Complete | MediaRecorder API |
| ElevenLabs Integration | ✅ Complete | Voice clone + TTS |
| Google Gemini Integration | ✅ Complete | Story generation |
| Stripe Integration | ✅ Complete | Checkout + Webhook |
| Feature Flags | ✅ Complete | Payment bypass for testing |
| **Build Status** | ✅ Passing | Ready for deployment |

### Environment Variables Status

```
✅ GEMINI_API_KEY        - Configured
✅ ELEVENLABS_API_KEY    - Configured
⬜ MONGODB_URI           - PENDING
⬜ BLOB_READ_WRITE_TOKEN - PENDING (auto-created on Vercel deploy)
⬜ STRIPE_*              - PENDING (bypassed via feature flag)
```

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Next.js 15 (Vercel)"]
        LP[Landing Page]
        VU[Voice Uploader]
        SF[Story Form]
        PP[Preview Player]
        FP[Full Story Player]
    end

    subgraph Storage["Storage"]
        MDB[(MongoDB Atlas)]
        BLOB[(Vercel Blob)]
    end

    subgraph External["External APIs"]
        GEM[Google Gemini]
        EL[ElevenLabs]
        ST[Stripe]
    end

    LP --> SF --> VU
    VU -->|voice sample| BLOB
    VU -->|clone voice| EL
    EL -->|voice_id| MDB
    SF -->|story request| GEM
    GEM -->|formatted story| EL
    EL -->|audio| BLOB
    PP -->|payment| ST
    ST -->|webhook| MDB
    MDB --> FP
```

---

## User Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js App
    participant DB as MongoDB
    participant EL as ElevenLabs
    participant LLM as Google Gemini
    participant S as Stripe

    U->>App: Submit child details + email
    App->>DB: Check user by email

    alt New User
        App->>U: Show voice recorder
        U->>App: Upload 30-60s sample
        App->>EL: Clone voice
        EL-->>App: voice_id
        App->>DB: Save user + voice_id
    else Returning User
        DB-->>App: Existing voice_id
    end

    App->>LLM: Generate 30-sec preview story
    LLM-->>App: Story text + music prompt
    App->>EL: TTS with voice_id
    EL-->>App: Preview audio
    App->>DB: Save story (status: preview)
    App->>U: Play 30-sec preview

    alt Payment Enabled
        U->>App: Click "Get Full Story"
        App->>S: Create Checkout Session
        S-->>U: Redirect to Stripe
        U->>S: Complete payment
        S->>App: Webhook (payment success)
        App->>DB: Update story (status: paid)
    else Payment Bypassed (Feature Flag)
        U->>App: Click "Get Full Story (Free)"
        App->>DB: Update story (bypass)
    end

    App->>LLM: Generate full 5-min story
    App->>EL: TTS full story
    App->>DB: Save audio URL (status: complete)
    App->>U: Show full story player
```

---

## Feature Flags

The app includes feature flags for development/testing in `src/lib/features.ts`:

```typescript
export const Features = {
  BYPASS_PAYMENT: true,  // Skip Stripe, allow free access
  MOCK_VOICE_CLONE: false,
  MOCK_STORY_GENERATION: false,
}
```

**Current Setting:** `BYPASS_PAYMENT: true` — Users can get full stories without payment.

To enable payments, set `BYPASS_PAYMENT: false`.

---

## Implementation Phases

### Phase 1: Project Setup ✅
- [x] Initialize Next.js 15 project
- [x] Configure Tailwind CSS v4
- [x] Set up TypeScript
- [x] Create directory structure
- [x] Configure PostCSS

### Phase 2: Database ✅
- [x] Create MongoDB connection helper (lazy-loaded)
- [x] Create User model (Mongoose)
- [x] Create Story model (Mongoose)
- [x] User lookup/create by email

### Phase 3: Voice Cloning ✅
- [x] Voice recorder component (MediaRecorder API)
- [x] Upload to Vercel Blob endpoint
- [x] ElevenLabs voice clone API integration
- [x] Store voice_id in database
- [x] Check for existing voice_id on return visit

### Phase 4: Story Generation ✅
- [x] Story request form component
- [x] Google Gemini integration (switched from OpenRouter)
- [x] Prompt engineering for narration formatting
- [x] ElevenLabs TTS integration
- [x] Generate 30-sec preview
- [x] Preview audio player component

### Phase 5: Stripe Integration ✅
- [x] Stripe checkout session endpoint
- [x] Webhook endpoint with signature verification
- [x] Link payment to story via metadata
- [x] Feature flag to bypass payment

### Phase 6: Full Story Generation ✅
- [x] Full story LLM prompt (5 minutes)
- [x] TTS for full story
- [x] Save to Vercel Blob
- [x] Full story player page
- [x] Download button

### Phase 7: Polish 🟡
- [x] Error handling
- [x] Loading states
- [ ] Set up MongoDB Atlas
- [ ] Deploy to Vercel
- [ ] Test end-to-end flow
- [ ] Mobile optimization

---

## File Structure

```
voice-bedtime-tales/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing + form
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── api/
│   │   │   ├── voice/
│   │   │   │   ├── check/route.ts      # Check if user has voice
│   │   │   │   ├── upload/route.ts     # Upload + clone voice
│   │   │   │   └── clone/route.ts      # Clone voice only
│   │   │   ├── story/
│   │   │   │   ├── [id]/route.ts       # Get story by ID
│   │   │   │   ├── preview/route.ts    # Generate 30-sec preview
│   │   │   │   └── full/route.ts       # Generate full story
│   │   │   ├── checkout/route.ts       # Create Stripe session
│   │   │   └── webhook/route.ts        # Stripe webhook
│   │   ├── preview/
│   │   │   └── [id]/page.tsx           # Preview player + pay CTA
│   │   └── story/
│   │       └── [id]/page.tsx           # Full story player
│   ├── components/
│   │   ├── VoiceRecorder.tsx           # Record voice sample
│   │   ├── StoryForm.tsx               # Child details form
│   │   ├── AudioPlayer.tsx             # Custom audio player
│   │   ├── PaymentButton.tsx           # Stripe payment button
│   │   └── FreeAccessButton.tsx        # Bypass payment button
│   ├── lib/
│   │   ├── mongodb.ts                  # MongoDB connection
│   │   ├── blob.ts                     # Vercel Blob helpers
│   │   ├── elevenlabs.ts               # Voice clone + TTS
│   │   ├── gemini.ts                   # Google Gemini integration
│   │   ├── stripe.ts                   # Stripe helpers
│   │   └── features.ts                 # Feature flags
│   └── models/
│       ├── User.ts                     # User schema
│       └── Story.ts                    # Story schema
├── .env.local                          # Local environment variables
├── .env.example                        # Environment template
├── package.json
├── tsconfig.json
└── IMPLEMENTATION.md                   # This file
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/voice/check` | POST | Check if user has existing voice_id |
| `/api/voice/upload` | POST | Upload voice sample + clone |
| `/api/voice/clone` | POST | Clone voice from URL |
| `/api/story/preview` | POST | Generate 30-sec preview |
| `/api/story/full` | POST | Generate full story |
| `/api/story/[id]` | GET | Get story by ID |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe webhooks |

---

## Environment Variables

```bash
# .env.local

# MongoDB (REQUIRED)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/voice_stories

# Vercel Blob (auto-created on deploy)
BLOB_READ_WRITE_TOKEN=

# ElevenLabs (CONFIGURED ✅)
ELEVENLABS_API_KEY=sk_xxxxx

# Google Gemini (CONFIGURED ✅)
GEMINI_API_KEY=AIzaSyxxxxx

# Stripe (optional if BYPASS_PAYMENT=true)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema (MongoDB)

### Collections

```typescript
// users collection
interface User {
  _id: ObjectId;
  email: string;              // unique index
  phone?: string;
  elevenlabsVoiceId?: string; // reused on return visits
  stripeCustomerId?: string;
  createdAt: Date;
}

// stories collection
interface Story {
  _id: ObjectId;
  userId: ObjectId;           // ref to users
  childName: string;
  childAge: number;
  interests: string;
  theme?: string;
  storyText?: string;
  previewText?: string;
  previewUrl?: string;        // Vercel Blob URL
  fullAudioUrl?: string;      // Vercel Blob URL
  backgroundMusicPrompt?: string;
  status: 'preview' | 'paid' | 'generating' | 'complete' | 'failed';
  stripeSessionId?: string;
  createdAt: Date;
}
```

### Story Status Flow

```
preview → paid → generating → complete
    ↓                ↓
  (bypass)        failed
    ↓
generating → complete
```

---

## Cost Estimate

| Service | Plan | Monthly Cost | Capacity |
|---------|------|--------------|----------|
| Vercel | Hobby | $0 | Sufficient for MVP |
| MongoDB Atlas | M0 Free | $0 | 512MB storage |
| Vercel Blob | Free | $0 | 1GB |
| ElevenLabs | Starter | $5 | ~15-20 stories |
| Google Gemini | Free tier | $0 | Generous free quota |
| Stripe | Per txn | 2.9% + $0.30 | - |
| **Total** | | **~$5/mo** | |

---

## Quick Reference: Story Narration

The Gemini prompt formats stories with pause markers:

```
Pause markers (for ElevenLabs TTS):
- Single em-dash (—) = ~1 second pause
- Double em-dash (— —) = ~2 second pause

Example:
"Once upon a time — in a cozy little cottage — there lived a girl named Emma. — —
She loved dinosaurs more than anything in the whole wide world."
```

ElevenLabs voice settings for bedtime narration:
```json
{
  "stability": 0.75,
  "similarity_boost": 0.70,
  "style": 0.30
}
```

---

## Next Steps (Priority Order)

### Immediate (Required for Testing)

1. **Set up MongoDB Atlas**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free M0 cluster
   - Create database user
   - Whitelist IP: `0.0.0.0/0`
   - Copy connection string to `.env.local`

2. **Test locally**
   ```bash
   npm run dev
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Add production environment variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add ELEVENLABS_API_KEY
   vercel env add GEMINI_API_KEY
   ```

### Later (For Production)

5. **Enable Stripe payments**
   - Set `BYPASS_PAYMENT: false` in `src/lib/features.ts`
   - Create Stripe product ($4.99)
   - Add Stripe environment variables
   - Set up webhook endpoint

6. **Polish**
   - Mobile optimization
   - Email notifications
   - Error tracking (Sentry)

---

## Changelog

| Date | Changes |
|------|---------|
| Jan 2, 2026 | Initial implementation complete |
| Jan 2, 2026 | Switched from OpenRouter to Google Gemini |
| Jan 2, 2026 | Added feature flags for payment bypass |
| Jan 2, 2026 | Configured ElevenLabs + Gemini API keys |
