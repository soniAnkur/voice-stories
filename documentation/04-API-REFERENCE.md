# API Reference

Complete reference for all API endpoints in the Voice Bedtime Tales application.

---

## Table of Contents

1. [Story API](#story-api)
2. [Children API](#children-api)
3. [Voice API](#voice-api)
4. [Payment API](#payment-api)
5. [Library API](#library-api)
6. [Audio Mixing API](#audio-mixing-api)
7. [Error Responses](#error-responses)

---

## Story API

### Generate Preview Story

Creates a 30-second preview story with music.

**Endpoint**: `POST /api/story/preview`

**Request Body**:
```json
{
  "email": "parent@example.com",
  "voiceId": "elevenlabs_voice_id_abc123",
  "childName": "Emma",
  "childAge": 5,
  "interests": "dinosaurs, dragons, adventures",
  "theme": "adventure"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "previewUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/stories/preview/Emma_adventure_preview_abc123_1704567890.mp3",
  "storyId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response** (Error - 400/500):
```json
{
  "error": "Missing required field: childName"
}
```

**Processing Time**: 15-30 seconds

**File**: `src/app/api/story/preview/route.ts`

---

### Generate Full Story

Creates a 10-minute full story (requires payment or bypass).

**Endpoint**: `POST /api/story/full`

**Request Body**:
```json
{
  "storyId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "fullAudioUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/stories/full/Emma_adventure_full_abc123_1704567890.mp3",
  "storyId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response** (Payment Required - 402):
```json
{
  "error": "Payment required. Story status is 'preview'."
}
```

**Response** (Already Generated - 200):
```json
{
  "success": true,
  "fullAudioUrl": "https://...",
  "message": "Story already complete"
}
```

**Processing Time**: 60-120 seconds

**File**: `src/app/api/story/full/route.ts`

---

## Children API

### Get Children List

Retrieves list of unique children from user's past stories.

**Endpoint**: `POST /api/children`

**Request Body**:
```json
{
  "email": "parent@example.com"
}
```

**Response** (Existing User - 200):
```json
{
  "success": true,
  "hasUser": true,
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "hasVoice": true,
  "children": [
    {
      "childName": "Emma",
      "childAge": 5,
      "interests": "dinosaurs, dragons",
      "storyCount": 3,
      "lastStoryDate": "2026-01-14T10:30:00.000Z"
    },
    {
      "childName": "Liam",
      "childAge": 7,
      "interests": "space, rockets",
      "storyCount": 2,
      "lastStoryDate": "2026-01-13T08:15:00.000Z"
    }
  ]
}
```

**Response** (New User - 200):
```json
{
  "success": true,
  "hasUser": false,
  "userId": null,
  "hasVoice": false,
  "children": []
}
```

**File**: `src/app/api/children/route.ts`

---

## Voice API

### Clone Voice

Creates a cloned voice from audio sample.

**Endpoint**: `POST /api/voice/clone`

**Request Body**:
```json
{
  "sampleUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/voice-samples/sample_1704567890.mp3",
  "email": "parent@example.com"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "voiceId": "elevenlabs_voice_id_abc123"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to clone voice: ElevenLabs API error"
}
```

**File**: `src/app/api/voice/clone/route.ts`

---

### Check Voice Status

Checks if user has a cloned voice.

**Endpoint**: `POST /api/voice/check`

**Request Body**:
```json
{
  "email": "parent@example.com"
}
```

**Response** (Has Voice - 200):
```json
{
  "hasVoice": true,
  "voiceId": "elevenlabs_voice_id_abc123"
}
```

**Response** (No Voice - 200):
```json
{
  "hasVoice": false
}
```

**File**: `src/app/api/voice/check/route.ts`

---

## Payment API

### Create Checkout Session

Creates a Stripe checkout session for full story purchase.

**Endpoint**: `POST /api/checkout`

**Request Body**:
```json
{
  "storyId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response** (Success - 200):
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
}
```

**Behavior**:
- If `BYPASS_PAYMENT=true`, immediately marks story as "paid"
- Otherwise, creates Stripe session and redirects

**File**: `src/app/api/checkout/route.ts`

---

### Stripe Webhook

Handles Stripe webhook events (checkout completion).

**Endpoint**: `POST /api/webhook`

**Headers**:
```
stripe-signature: t=1704567890,v1=abc123...
```

**Request Body** (Stripe Event):
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_a1b2c3...",
      "metadata": {
        "storyId": "65a1b2c3d4e5f6g7h8i9j0k1"
      }
    }
  }
}
```

**Response** (Success - 200):
```json
{
  "received": true
}
```

**Behavior**:
- Verifies webhook signature
- Updates story status to "paid"
- Can trigger background full story generation

**File**: `src/app/api/webhook/route.ts`

---

## Library API

### Get Album List

Retrieves all story albums grouped by voice ID.

**Endpoint**: `GET /api/library/albums`

**Response** (Success - 200):
```json
{
  "albums": [
    {
      "voiceId": "elevenlabs_voice_id_abc123",
      "ownerEmail": "parent@example.com",
      "storyCount": 8,
      "latestStoryDate": "2026-01-14T10:30:00.000Z",
      "coverStories": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
          "theme": "adventure",
          "childName": "Emma"
        },
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "theme": "ocean",
          "childName": "Emma"
        }
      ]
    }
  ]
}
```

**File**: `src/app/api/library/albums/route.ts`

---

### Get Album Details

Retrieves all stories for a specific voice ID.

**Endpoint**: `GET /api/library/albums/[voiceId]`

**Example**: `GET /api/library/albums/elevenlabs_voice_id_abc123`

**Response** (Success - 200):
```json
{
  "voiceId": "elevenlabs_voice_id_abc123",
  "ownerEmail": "parent@example.com",
  "storyCount": 8,
  "stories": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "childName": "Emma",
      "childAge": 5,
      "interests": "dinosaurs",
      "theme": "adventure",
      "fullAudioUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/stories/full/Emma_adventure_full_abc123_1704567890.mp3",
      "status": "complete",
      "createdAt": "2026-01-14T10:30:00.000Z",
      "effectiveVoiceId": "elevenlabs_voice_id_abc123",
      "ownerEmail": "parent@example.com"
    }
  ]
}
```

**File**: `src/app/api/library/albums/[voiceId]/route.ts`

---

## Audio Mixing API

### Re-mix Story Audio

Re-mixes existing story with different music settings.

**Endpoint**: `POST /api/audio/mix`

**Request Body**:
```json
{
  "storyId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "musicVolume": 0.3,
  "musicTrackId": "ocean-waves"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "fullAudioUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/stories/full/Emma_adventure_full_abc123_1704567899.mp3"
}
```

**File**: `src/app/api/audio/mix/route.ts`

---

## FFmpeg Remote API

### Mix Audio (Remote Server)

Remote FFmpeg server endpoint for audio mixing.

**Endpoint**: `POST [FFMPEG_API_URL]/api/mix`

**Headers**:
```
Authorization: Bearer [FFMPEG_API_KEY]
Content-Type: application/json
```

**Request Body**:
```json
{
  "narrationUrl": "https://r2.dev/narration.mp3",
  "musicUrl": "https://r2.dev/music.mp3",
  "musicVolume": 0.25,
  "fadeInDuration": 2,
  "fadeOutDuration": 3,
  "ducking": true,
  "duckingAmount": 0.5,
  "applyDreamyEffects": true
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "mixedUrl": "https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev/voice-stories/mixed/job_abc123.mp3",
  "processingTime": "12.5s"
}
```

**Response** (Error - 400/500):
```json
{
  "error": "Missing required field: narrationUrl"
}
```

**File**: `/ffmpeg-api/index.js`

---

## Error Responses

### Standard Error Format

All errors return JSON with `error` field:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing/invalid parameters |
| 402 | Payment Required | Story not paid for |
| 404 | Not Found | Story/User not found |
| 500 | Internal Server Error | API failures, processing errors |

### Common Errors

**Missing Required Fields**:
```json
{
  "error": "Missing required field: childName"
}
```

**Story Not Found**:
```json
{
  "error": "Story not found"
}
```

**Payment Required**:
```json
{
  "error": "Payment required. Story status is 'preview'."
}
```

**External API Failure**:
```json
{
  "error": "Failed to generate story: Gemini API error"
}
```

**Database Error**:
```json
{
  "error": "Database connection failed"
}
```

---

## Rate Limiting

Currently **no rate limiting** is enforced at the API level.

**Considerations for Production**:
- Implement per-IP rate limiting
- Limit story generations per email per day
- Throttle voice cloning attempts

**External API Limits**:
- **Gemini**: 15 RPM (free tier)
- **ElevenLabs**: Character quota per month
- **Mubert**: Track generation quota

---

## Authentication

Currently **no authentication** is required.

**Email-based identification**:
- Users identified by email address
- No passwords or sessions
- Voice ID stored per email

**Stripe Security**:
- Webhook signature verification
- Server-side payment validation

---

## CORS

**Configuration**: Enabled for all origins in development

**Production Recommendation**:
- Restrict to specific domains
- Configure in `next.config.ts`

---

**Last Updated**: January 14, 2026
