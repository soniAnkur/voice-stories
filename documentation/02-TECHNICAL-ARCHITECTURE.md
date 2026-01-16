# Technical Architecture

Complete technical overview of the Voice Bedtime Tales application.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [External Services](#external-services)
5. [File Storage](#file-storage)
6. [Security](#security)
7. [Scalability](#scalability)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Home Page  │  │  Preview     │  │   Library              │ │
│  │   Wizard     │  │  Player      │  │   Albums & Stories     │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / Next.js API Routes
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS 16 APPLICATION (Vercel)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Routes                                                  │ │
│  │  /api/story/preview  /api/story/full  /api/children        │ │
│  │  /api/voice/clone    /api/checkout    /api/webhook         │ │
│  │  /api/library/albums                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Core Libraries                                              │ │
│  │  gemini.ts  elevenlabs.ts  music.ts  audioMixer.ts         │ │
│  │  mongodb.ts  blob.ts  stripe.ts                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────┬──────────────┬────────────────┘
                 │               │              │
                 ↓               ↓              ↓
      ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
      │  MongoDB     │  │  Cloudflare   │  │  Stripe      │
      │  Atlas       │  │  R2 Storage   │  │  Payments    │
      └──────────────┘  └───────────────┘  └──────────────┘

                 ↓
    ┌────────────────────────────────────────────────┐
    │      EXTERNAL AI/AUDIO SERVICES                │
    │  ┌──────────────┐  ┌──────────────┐           │
    │  │ Google       │  │ ElevenLabs   │           │
    │  │ Gemini 2.0   │  │ Voice Clone  │           │
    │  │ Flash        │  │ & TTS v3     │           │
    │  └──────────────┘  └──────────────┘           │
    │  ┌──────────────┐  ┌──────────────┐           │
    │  │ Mubert AI    │  │ FFmpeg API   │           │
    │  │ Music Gen    │  │ VPS Server   │           │
    │  │ (Optional)   │  │ Audio Mix    │           │
    │  └──────────────┘  └──────────────┘           │
    └────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.7.3 | Type safety |
| **Tailwind CSS** | 4.1.18 | Styling framework |
| **Turbopack** | Built-in | Fast bundler |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | Runtime environment |
| **Mongoose** | 9.1.1 | MongoDB ODM |
| **AWS SDK S3** | 3.967.0 | Cloudflare R2 integration |
| **Stripe** | 20.1.0 | Payment processing |

### Database
| Technology | Purpose |
|------------|---------|
| **MongoDB Atlas** | Production database |
| **MongoDB Local** | Development database |

### Storage
| Technology | Purpose |
|------------|---------|
| **Cloudflare R2** | Audio file storage (S3-compatible) |

### External APIs
| Service | Purpose | Cost |
|---------|---------|------|
| **Google Gemini 2.0 Flash** | Story text generation | Pay-per-token |
| **ElevenLabs API v3** | Voice cloning & TTS | Pay-per-character |
| **Mubert API** | AI music generation | Optional, pay-per-track |
| **Stripe** | Payment processing | 2.9% + 30¢ per transaction |

### Audio Processing
| Technology | Purpose |
|------------|---------|
| **FFmpeg** | Audio mixing & effects |
| **Express.js Server** | Remote FFmpeg API (VPS) |

---

## Database Architecture

### Collections

#### **users**
Stores parent/caregiver information and voice IDs.

```typescript
interface User {
  _id: ObjectId;
  email: string;              // Unique, lowercase, indexed
  elevenlabsVoiceId?: string; // Cloned voice ID from ElevenLabs
  stripeCustomerId?: string;  // Stripe customer ID
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `email`: Unique index for fast lookup
- `elevenlabsVoiceId`: Index for library grouping

#### **stories**
Stores all story records (preview + full).

```typescript
interface Story {
  _id: ObjectId;

  // User association (optional for non-logged-in users)
  userId?: ObjectId;          // Reference to User._id
  voiceId?: string;           // Direct voice ID (if no userId)

  // Child information
  childName: string;          // Required
  childAge: number;           // Required, 2-10
  interests: string;          // Required, comma-separated
  theme?: string;             // adventure, animals, space, etc.
  customPrompt?: string;      // Custom story instructions

  // Story content
  previewText?: string;       // ~100 words preview
  storyText?: string;         // 1400-1600 words full story

  // Audio files
  previewUrl?: string;        // R2 URL for 30-sec preview
  fullAudioUrl?: string;      // R2 URL for 10-min story

  // Music
  backgroundMusicPrompt?: string; // From Gemini
  musicTrackId?: string;      // Selected track filename
  musicSource?: "library" | "mubert";
  hasMusicMixed?: boolean;
  musicVolume?: number;       // Default 0.25

  // Status tracking
  status: "preview" | "paid" | "generating" | "complete" | "failed";

  // Payment
  stripeSessionId?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `userId`: For user story queries
- `voiceId`: For library grouping
- `status`: For filtering complete stories
- `createdAt`: For sorting (descending)

### Data Relationships

```
┌──────────────┐
│   User       │
│   _id        │◄────┐
│   email      │     │
│   voiceId    │     │ Reference
└──────────────┘     │
                     │
              ┌──────────────┐
              │   Story      │
              │   _id        │
              │   userId ────┘
              │   voiceId    │
              │   childName  │
              │   status     │
              │   audioUrl   │
              └──────────────┘
```

---

## External Services

### Google Gemini 2.0 Flash

**Purpose**: Story text generation

**Configuration**:
```typescript
BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
API_KEY: process.env.GEMINI_API_KEY
```

**Rate Limits**:
- Free tier: 15 RPM, 1 million TPM, 1500 RPD
- Paid tier: Higher limits

**Request Format**:
```json
{
  "contents": [{
    "parts": [{
      "text": "System prompt + User prompt"
    }]
  }],
  "generationConfig": {
    "temperature": 0.85,
    "maxOutputTokens": 4000
  }
}
```

**Error Handling**:
- Quota exceeded → Fallback to mock stories
- API error → Return error to user

---

### ElevenLabs API v3

**Purpose**: Voice cloning & text-to-speech

**Configuration**:
```typescript
BASE_URL: "https://api.elevenlabs.io/v1"
API_KEY: process.env.ELEVENLABS_API_KEY
```

**Endpoints Used**:

1. **Voice Cloning**:
   ```
   POST /v1/voices/add
   Content-Type: multipart/form-data

   FormData:
     - name: "Parent Name"
     - files: [audioBuffer]
     - description: "Voice Bedtime Tales - Parent Voice"
   ```

2. **Text-to-Speech**:
   ```
   POST /v1/text-to-speech/{voiceId}
   Content-Type: application/json

   Body:
     - text: Story text with [tags]
     - model_id: "eleven_v3"
     - voice_settings: {
         stability: 0.5,
         similarity_boost: 0.75,
         style: 0.4,
         speed: 0.7
       }
   ```

**Audio Tags Supported**:
- `[softly]`, `[whispers]`, `[warmly]`
- `[excited]`, `[curious]`
- `[pause]`, `[long pause]`
- `[sighs]`, `[yawns]`

**Rate Limits**:
- Character limits per month (subscription-based)
- Voice clone limit (subscription-based)

---

### Mubert AI (Optional)

**Purpose**: AI-generated background music

**Configuration**:
```typescript
BASE_URL: "https://api-b2b.mubert.com/v2"
API_KEY: process.env.MUBERT_API_KEY (optional)
```

**Flow**:
1. Get PAT token: `POST /GetServiceAccess`
2. Generate track: `POST /RecordTrackTTM`

**Parameters**:
```json
{
  "prompt": "gentle piano lullaby calm peaceful",
  "duration": 600,
  "intensity": "low",
  "format": "mp3",
  "mode": "loop"
}
```

**Fallback**: Curated music library if API key not set

---

### Stripe

**Purpose**: Payment processing

**Configuration**:
```typescript
SECRET_KEY: process.env.STRIPE_SECRET_KEY
PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
PRICE_ID: process.env.STRIPE_PRICE_ID
WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
```

**Flow**:
1. Create checkout session
2. Redirect to Stripe
3. User pays
4. Webhook `checkout.session.completed` → Update story status
5. Redirect to success page

**Development Bypass**:
```env
BYPASS_PAYMENT=true
```

---

## File Storage

### Cloudflare R2

**Configuration**:
```typescript
ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID
BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME
PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL
```

**Endpoint**:
```
https://{accountId}.r2.cloudflarestorage.com
```

**Directory Structure**:
```
kids-storybooks-images/          # Bucket name
├── voice-stories/
│   ├── voice-samples/
│   │   └── [userId]_[timestamp].mp3
│   ├── stories/
│   │   ├── preview/
│   │   │   └── [childName]_[theme]_preview_[voiceId]_[timestamp].mp3
│   │   └── full/
│   │       └── [childName]_[theme]_full_[voiceId]_[timestamp].mp3
│   └── mixed/
│       └── [jobId].mp3          # Remote API temporary files
```

**Access Control**:
- Public read access via R2.dev domain
- 1-year cache headers
- CORS enabled

**File Upload Process**:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

await s3Client.send(new PutObjectCommand({
  Bucket: bucketName,
  Key: `voice-stories/stories/preview/${filename}.mp3`,
  Body: audioBuffer,
  ContentType: "audio/mpeg",
  CacheControl: "public, max-age=31536000"
}));
```

---

## Security

### API Keys Protection
- All API keys stored in `.env.local` (never committed)
- Vercel environment variables for production
- Server-side only (never exposed to client)

### Database Security
- MongoDB connection string with authentication
- IP whitelist on MongoDB Atlas
- Secure SSL/TLS connections

### File Access
- R2 bucket with public read, private write
- Presigned URLs not needed (public bucket)
- Filename obfuscation with timestamps

### Payment Security
- Stripe webhook signature verification
- Server-side payment validation
- No sensitive data in client

### User Data
- Email is primary identifier (no passwords)
- Voice recordings stored securely
- GDPR considerations: data deletion on request

---

## Scalability

### Database Scalability
- **MongoDB Atlas**: Auto-scaling clusters
- **Indexes**: Optimized for common queries
- **Connection Pooling**: Mongoose with cached connections

### Storage Scalability
- **Cloudflare R2**: Unlimited storage, pay-as-you-go
- **CDN**: Global distribution via R2.dev
- **Caching**: 1-year cache reduces requests

### API Rate Limiting
- **Gemini**: Handle quota exceeded with mocks
- **ElevenLabs**: Monitor character usage
- **Mubert**: Optional, fallback to library

### Compute Scalability
- **Vercel**: Auto-scaling serverless functions
- **FFmpeg API**: Separate VPS, can scale horizontally
- **Background Jobs**: Can move to queue (SQS, BullMQ)

### Performance Optimizations

1. **Parallel Processing**:
   ```typescript
   const [storyData, musicUrl] = await Promise.all([
     generatePreviewStory(...),
     getBackgroundMusic(...)
   ]);
   ```

2. **Database Connection Caching**:
   ```typescript
   const cached = global.mongoose || { conn: null, promise: null };
   if (cached.conn) return cached.conn;
   ```

3. **Streaming Uploads**:
   ```typescript
   // Stream directly to R2 without temp files
   await uploadAudio(buffer, filename);
   ```

4. **Edge Caching**:
   - R2 responses cached at edge
   - Static assets on Vercel Edge Network

---

## Monitoring & Observability

### Logging
- Console logs for development
- Vercel logs for production
- FFmpeg API logs to stdout

### Error Tracking
- Try-catch blocks in all API routes
- Error responses with status codes
- Fallback mechanisms for external APIs

### Metrics to Monitor
- **API Response Times**: Gemini, ElevenLabs, FFmpeg
- **Error Rates**: Failed story generations
- **Storage Usage**: R2 bucket size
- **Database Performance**: MongoDB query times
- **Cost Tracking**: External API usage

---

## Deployment Architecture

```
┌────────────────────────────────────────────────┐
│              Vercel (Global Edge)              │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Next.js Application                     │ │
│  │  - Serverless Functions (API Routes)     │ │
│  │  - Static Pages (SSG/SSR)                │ │
│  │  - Environment Variables                 │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
              │                 │
              ↓                 ↓
┌──────────────────┐  ┌──────────────────────┐
│  MongoDB Atlas   │  │  Cloudflare R2       │
│  - Auto-scaling  │  │  - Global CDN        │
│  - Replica sets  │  │  - Edge caching      │
└──────────────────┘  └──────────────────────┘

              ↓
┌────────────────────────────────────────────────┐
│              VPS Server (Optional)             │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  FFmpeg API (Express.js)                 │ │
│  │  - Audio mixing endpoint                 │ │
│  │  - FFmpeg installed                      │ │
│  │  - LocalTunnel/ngrok for HTTPS           │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

---

**Last Updated**: January 14, 2026
