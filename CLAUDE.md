# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Bedtime Tales is a Next.js application that creates personalized bedtime stories narrated in a parent's cloned voice. Parents record a voice sample, provide child details, and the system generates unique stories with AI, narrates them with voice cloning, mixes in background music, and stores them in a library.

**Tech Stack:** Next.js 16 + React 19 + TypeScript + MongoDB + Tailwind CSS 4 + Vercel

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

**TypeScript check:** `npx tsc --noEmit`

**Kill port 3000:** `lsof -ti:3000 | xargs kill`

## Architecture

### Story Generation Pipeline

The core flow is: **Voice Recording → Voice Cloning → Story Generation → TTS → Music → Audio Mixing → R2 Upload**

1. **Voice Cloning** (`src/lib/elevenlabs.ts`): ElevenLabs API clones user voice from 30-60s sample
2. **Story Generation** (`src/lib/gemini.ts`): Google Gemini 2.0 Flash generates age-appropriate story text with archetype variety
3. **Text-to-Speech** (`src/lib/elevenlabs.ts`): ElevenLabs narrates story with cloned voice (0.7x speed for bedtime)
4. **Music Selection** (`src/lib/music.ts`): Mubert AI or curated library in `/public/music/`
5. **Audio Mixing** (`src/lib/simpleAudioMixer.ts`): Pure JavaScript mixer using mpg123-decoder + lamejs (no FFmpeg required)
6. **Storage** (`src/lib/blob.ts`): Cloudflare R2 for audio/image files

### Key API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/story/preview` | Generate 30-second preview (Gemini + TTS + music + mix) |
| `POST /api/story/full` | Generate 10-minute full story |
| `POST /api/voice/clone` | Clone voice from recording |
| `POST /api/checkout` | Create Stripe checkout session |
| `POST /api/webhook` | Stripe webhook (triggers full story on payment) |
| `GET /api/library/albums` | Get story albums grouped by voice |

### Database Models

**User** (`src/models/User.ts`): email (unique), elevenlabsVoiceId, stripeCustomerId

**Story** (`src/models/Story.ts`): childName, childAge, interests, theme, previewUrl, fullAudioUrl, status (preview/paid/generating/complete/failed)

### Frontend Structure

- **Pages**: App Router in `src/app/` - home, `/create` (5-step wizard), `/preview/[id]`, `/story/[id]`, `/library`
- **Player Context**: `src/components/player/PlayerProvider.tsx` manages global audio state
- **Navigation**: Bottom tab bar for mobile, floating mini player

## External Services

- **Google Gemini**: Story generation (uses story archetypes for variety)
- **ElevenLabs**: Voice cloning + TTS with custom bedtime voice settings
- **Cloudflare R2**: S3-compatible storage for audio files
- **Stripe**: $4.99 per full story payment
- **Mubert** (optional): AI-generated background music

## Environment Variables

Required keys: `MONGODB_URI`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `CLOUDFLARE_R2_*`

Development flags:
- `BYPASS_PAYMENT=true` - Skip Stripe payment
- `MOCK_STORY_GENERATION=true` - Use mock stories for faster testing

## Key Implementation Details

- **Audio mixing runs on Vercel serverless** - Uses WASM-based MP3 decoder and pure JS encoder, no FFmpeg server needed
- **Story archetypes** in `gemini.ts` ensure variety (The Helper, The Discovery, The Mystery, etc.)
- **Voice settings** optimized for bedtime: 0.7x speed, stability 0.5, supports audio tags like [softly], [whispers]
- **MongoDB connection pooling** in `mongodb.ts` uses global caching for serverless
- **Stories grouped by voiceId** for album organization in library

## Path Aliases

`@/*` maps to `./src/*` - use `@/lib/`, `@/components/`, `@/models/`
