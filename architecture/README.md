# Voice Stories - E2E Architecture Documentation

## Overview

Voice Stories is a personalized bedtime story application that generates custom audio stories for children using AI-powered text generation, voice cloning, and professional audio mixing.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Voice Setup │  │Story Config │  │   Preview   │  │     Audio Player        │ │
│  │    Page     │  │    Form     │  │   Player    │  │  (Final Story)          │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                │                     │
          ▼                ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Next.js App)                                   │
│                                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│  │ /api/voice/clone │  │/api/story/preview│  │ /api/story/full  │               │
│  │   (60s timeout)  │  │   (60s timeout)  │  │  (300s timeout)  │               │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                     │                          │
└───────────┼─────────────────────┼─────────────────────┼──────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                       │
│                                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  ElevenLabs │  │   Google    │  │  MongoDB    │  │   Cloudflare R2         │  │
│  │    (TTS)    │  │   Gemini    │  │   Atlas     │  │   (Audio Storage)       │  │
│  │             │  │   (LLM)     │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                                    │
│                        ┌─────────────────────────────┐                            │
│                        │  Hostinger VPS (FFmpeg API) │                            │
│                        │  srv877962.hstgr.cloud:443  │                            │
│                        │  nginx → Node.js:8081       │                            │
│                        └─────────────────────────────┘                            │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Vercel (Next.js Application)

**Purpose**: Hosts the frontend and API routes

| Component | Description |
|-----------|-------------|
| Frontend | React/Next.js pages for voice setup, story configuration, playback |
| API Routes | Serverless functions handling voice cloning, story generation, audio mixing |
| Static Assets | Background music files served from `/public/music/` |

**Key Files**:
- `src/app/api/voice/clone/route.ts` - Voice cloning endpoint
- `src/app/api/story/preview/route.ts` - Preview story generation
- `src/app/api/story/full/route.ts` - Full story generation

### 2. Google Gemini (Story Generation)

**Purpose**: AI-powered story text generation

**Flow**:
1. Receives child's name, age, interests, theme
2. Generates personalized bedtime story
3. Returns story text + background music prompt

**Configuration**:
- Model: `gemini-1.5-flash` (preview) / `gemini-1.5-pro` (full)
- Temperature: 0.9 for creative storytelling

### 3. ElevenLabs (Voice Synthesis)

**Purpose**: Text-to-speech with cloned voices

**Features**:
- Voice cloning from 1-minute audio sample
- Adjustable speed (0.7 = slowest for bedtime)
- High-quality MP3 output

**Flow**:
1. Clone user's voice from uploaded sample
2. Store `voiceId` in MongoDB
3. Use voice for all story narrations

### 4. FFmpeg API (Hostinger VPS)

**Purpose**: Professional audio mixing with sidechain compression

**Location**: `https://srv877962.hstgr.cloud`

**Stack**:
```
nginx (SSL termination, port 443)
    │
    ▼
Node.js Express (port 8081)
    │
    ▼
FFmpeg binary (audio processing)
```

**Features**:
- Sidechain ducking (music volume drops when voice speaks)
- Dreamy effects (lowpass filter, subtle echo)
- Loudness normalization (EBU R128)
- Fade in/out transitions

**API Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/mix` | POST | Mix narration with background music |

### 5. Cloudflare R2 (Audio Storage)

**Purpose**: Store generated audio files

**Bucket**: `kids-storybooks-images`

**Structure**:
```
voice-stories/
├── preview/
│   └── {storyId}.mp3
├── full/
│   └── {storyId}.mp3
└── mixed/
    └── {jobId}.mp3  (temporary from VPS)
```

### 6. MongoDB Atlas

**Purpose**: Store user and story data

**Collections**:
- `users` - User profiles, ElevenLabs voice IDs
- `stories` - Story metadata, URLs, status

---

## E2E Flow Diagrams

### Flow 1: Voice Cloning

```
┌──────────┐     ┌─────────┐     ┌───────────┐     ┌─────────┐
│  Client  │────▶│ Vercel  │────▶│ ElevenLabs│────▶│ MongoDB │
│          │     │  API    │     │   Clone   │     │  Store  │
└──────────┘     └─────────┘     └───────────┘     └─────────┘
     │                │                │                │
     │  1. Upload     │  2. Send       │  3. Return     │
     │  voice sample  │  audio sample  │  voiceId       │
     │                │                │                │
     │                │                │  4. Store      │
     │                │                │  voiceId       │
     │                │                │                │
     │◀───────────────┼────────────────┼────────────────┤
     │         5. Return success                        │
```

### Flow 2: Preview Story Generation

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐
│  Client  │────▶│ Vercel  │────▶│  Gemini  │────▶│ ElevenLabs│
│          │     │  API    │     │   LLM    │     │    TTS    │
└──────────┘     └─────────┘     └──────────┘     └───────────┘
                      │                                  │
                      │                                  │
                      ▼                                  ▼
                ┌──────────┐     ┌──────────┐     ┌──────────┐
                │  Music   │────▶│ FFmpeg   │────▶│    R2    │
                │  Library │     │   VPS    │     │  Upload  │
                └──────────┘     └──────────┘     └──────────┘

Step-by-step:
1. Client → Vercel: Story config (name, age, interests, theme)
2. Vercel → Gemini: Generate preview story text (~500 words)
3. Vercel → ElevenLabs: Convert story to speech
4. Vercel → R2: Upload narration temporarily
5. Vercel → FFmpeg VPS: Mix narration + background music
   - Download narration from R2
   - Download music from Vercel static files
   - Apply sidechain ducking + dreamy effects
   - Upload mixed audio to R2
6. Vercel → Client: Return preview URL
```

### Flow 3: Full Story Generation

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐
│  Client  │────▶│ Vercel  │────▶│  Gemini  │────▶│ ElevenLabs│
│          │     │  API    │     │ (Pro)    │     │    TTS    │
└──────────┘     └─────────┘     └──────────┘     └───────────┘
                      │               │                  │
                      │    (5-7 min   │    (1500+ words  │
                      │     story)    │     ~5 min audio)│
                      ▼               ▼                  ▼
                ┌──────────┐     ┌──────────┐     ┌──────────┐
                │  Music   │────▶│ FFmpeg   │────▶│    R2    │
                │  Library │     │   VPS    │     │  Upload  │
                └──────────┘     └──────────┘     └──────────┘
                                      │
                                      │  (Processing
                                      │   30-60s)
                                      ▼
                                ┌──────────┐
                                │ MongoDB  │
                                │  Update  │
                                └──────────┘
```

---

## Audio Processing Pipeline (FFmpeg)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FFmpeg Filter Complex                                 │
│                                                                             │
│  Input 1: Narration (voice.mp3)                                             │
│  Input 2: Background Music (music.mp3)                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Voice Processing Chain                                               │   │
│  │                                                                      │   │
│  │  [0:a] ─▶ lowpass(6kHz) ─▶ echo(subtle) ─▶ format ─▶ asplit ─┬▶[voice]  │
│  │                                                               │         │
│  │                                                               └▶[voicesc]│
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Music Processing Chain                                               │   │
│  │                                                                      │   │
│  │  [1:a] ─▶ loop ─▶ trim ─▶ volume(0.25) ─▶ fadeIn ─▶ fadeOut ─▶[musicfaded]│
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Sidechain Ducking                                                    │   │
│  │                                                                      │   │
│  │  [musicfaded] + [voicesc] ─▶ sidechaincompress ─▶ [musicducked]     │   │
│  │                                                                      │   │
│  │  Parameters:                                                         │   │
│  │  - threshold: 0.02 (trigger on quiet speech)                         │   │
│  │  - ratio: 4:1 (moderate compression)                                 │   │
│  │  - attack: 50ms (quick duck)                                         │   │
│  │  - release: 400ms (smooth return)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Final Mix                                                            │   │
│  │                                                                      │   │
│  │  [voice] + [musicducked] ─▶ amix ─▶ loudnorm(EBU R128) ─▶ [final]   │   │
│  │                                                                      │   │
│  │  Loudness Target: -16 LUFS, -1.5 dBTP, 11 LRA                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Output: mixed.mp3 (192kbps)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Vercel (.env.local / Vercel Dashboard)

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# ElevenLabs
ELEVENLABS_API_KEY=...

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=...

# FFmpeg API (VPS)
FFMPEG_API_URL=https://srv877962.hstgr.cloud
FFMPEG_API_KEY=<secure-api-key>

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev

# App URL (for absolute paths)
NEXT_PUBLIC_APP_URL=https://voice-stories.vercel.app
```

### VPS (/opt/ffmpeg-api/.env)

```bash
PORT=8081
API_KEY=<secure-api-key>
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev
ALLOWED_ORIGINS=https://voice-stories.vercel.app,http://localhost:3000
```

---

## Infrastructure Diagram

```
                    ┌─────────────────────────────────────┐
                    │           INTERNET                   │
                    └─────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Vercel   │   │ Hostinger │   │Cloudflare │
            │  Edge     │   │   VPS     │   │    R2     │
            │  Network  │   │           │   │           │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  │               │               │
    ┌─────────────┼───────────────┼───────────────┼─────────────┐
    │             │               │               │             │
    ▼             ▼               ▼               ▼             ▼
┌───────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│Browser│   │ Next.js   │   │  nginx    │   │  S3 API   │   │ MongoDB   │
│       │   │ Functions │   │  + SSL    │   │ Endpoint  │   │  Atlas    │
│       │   │           │   │  :443     │   │           │   │           │
└───────┘   └───────────┘   └─────┬─────┘   └───────────┘   └───────────┘
                                  │
                                  ▼
                            ┌───────────┐
                            │ Express   │
                            │ :8081     │
                            │           │
                            │ + FFmpeg  │
                            │ binary    │
                            └───────────┘
```

---

## Security Considerations

1. **API Authentication**
   - FFmpeg API protected with Bearer token
   - Token stored in environment variables

2. **CORS Configuration**
   - VPS only accepts requests from allowed origins
   - Prevents unauthorized API access

3. **SSL/TLS**
   - All traffic encrypted (Let's Encrypt certificates)
   - Auto-renewal via certbot

4. **Firewall**
   - VPS: Only ports 22 (SSH), 80, 443 open
   - Internal services on localhost only

5. **File Handling**
   - Temporary files cleaned up after processing
   - R2 files have 1-year cache headers

---

## Monitoring & Maintenance

### VPS Commands

```bash
# View logs
pm2 logs ffmpeg-api

# Restart service
pm2 restart ffmpeg-api

# Check status
pm2 status

# Monitor resources
pm2 monit

# Nginx status
systemctl status nginx

# SSL certificate renewal
certbot renew --dry-run
```

### Health Checks

```bash
# VPS health
curl https://srv877962.hstgr.cloud/api/health

# Expected response:
# {"status":"ok","ffmpeg":true,"timestamp":"..."}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Music not mixing | Relative URL | Check `NEXT_PUBLIC_APP_URL` is set |
| FFmpeg error 234 | Stream reuse | Ensure `asplit` creates separate streams |
| Too much echo | Heavy effects | Reduce echo parameters in ffmpeg.js |
| Timeout on full story | Long processing | Check Vercel `maxDuration` setting |
| SSL errors | Certificate expired | Run `certbot renew` on VPS |

---

## Future Improvements

1. **CDN for Audio**: Add Cloudflare CDN in front of R2
2. **Queue System**: Add Redis/Bull for background job processing
3. **Caching**: Cache generated stories for faster replay
4. **Analytics**: Track story generation metrics
5. **Multi-region**: Deploy FFmpeg API to multiple regions
