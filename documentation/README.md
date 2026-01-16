# Voice Bedtime Tales - Documentation

**Your Voice, Their Dreams**

Complete documentation for the Voice Bedtime Tales application.

## Table of Contents

1. [End-to-End Application Flow](./01-END-TO-END-FLOW.md)
   - Complete user journey from email entry to story playback
   - Data flows and system interactions

2. [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
   - System architecture overview
   - Technology stack
   - Database models
   - External services integration

3. [Story Generation Pipeline](./03-STORY-GENERATION-PIPELINE.md)
   - Story composition (Google Gemini)
   - Music generation and selection
   - Voice narration (ElevenLabs)
   - Audio mixing (FFmpeg)

4. [API Reference](./04-API-REFERENCE.md)
   - All API endpoints
   - Request/response formats
   - Error handling

5. [Setup Guide](./05-SETUP-GUIDE.md)
   - Local development setup
   - Environment variables
   - Dependencies installation

6. [Deployment Guide](./06-DEPLOYMENT-GUIDE.md)
   - Vercel deployment
   - MongoDB Atlas setup
   - FFmpeg API server setup
   - Environment configuration

---

## Quick Links

- **Project Repository**: `/Users/ankursoni/2026/voice_stories`
- **FFmpeg API**: `/Users/ankursoni/2026/voice_stories/ffmpeg-api`
- **Live Application**: `NEXT_PUBLIC_APP_URL` (configured in `.env.local`)

---

## Overview

Voice Bedtime Tales creates personalized bedtime stories narrated in a parent's cloned voice. The application combines:

- **AI Story Generation** (Google Gemini 2.0 Flash)
- **Voice Cloning** (ElevenLabs API v3)
- **Background Music** (Mubert AI or Curated Library)
- **Professional Audio Mixing** (FFmpeg with sidechain compression)
- **Cloud Storage** (Cloudflare R2)
- **Payments** (Stripe)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 with Turbopack
- **UI**: React 19, Tailwind CSS 4
- **TypeScript**: 5.7.3

### Backend
- **Database**: MongoDB with Mongoose
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Stripe

### External APIs
- **Story Generation**: Google Gemini 2.0 Flash
- **Voice Cloning & TTS**: ElevenLabs API v3
- **Music Generation**: Mubert API (optional)
- **Audio Processing**: FFmpeg (local or remote API)

### Infrastructure
- **Hosting**: Vercel
- **FFmpeg Server**: VPS with Express.js
- **Database**: MongoDB Atlas

---

## Key Features

1. **Voice Cloning**: Clone parent's voice from 30-60 second sample
2. **Personalized Stories**: Child's name, age, and interests integrated
3. **Age-Appropriate Content**: 2-10 years old
4. **Background Music**: AI-generated or curated library
5. **Professional Audio**: Sidechain compression, dreamy effects
6. **Preview System**: 30-second preview before purchase
7. **Payment Gateway**: Stripe integration
8. **Library**: Organized by voice ID (albums of stories)

---

## Project Structure

```
voice_stories/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   ├── checkout/     # Stripe checkout
│   │   ├── library/      # Story library
│   │   ├── preview/      # Story preview
│   │   └── success/      # Payment success
│   ├── components/       # React components
│   ├── lib/              # Core libraries
│   │   ├── audioMixer.ts    # FFmpeg integration
│   │   ├── blob.ts          # Cloudflare R2
│   │   ├── elevenlabs.ts    # Voice cloning/TTS
│   │   ├── gemini.ts        # Story generation
│   │   ├── mongodb.ts       # Database connection
│   │   └── music.ts         # Music selection
│   ├── models/           # MongoDB schemas
│   └── types/            # TypeScript types
├── ffmpeg-api/           # Remote FFmpeg server
├── public/               # Static assets
│   └── music/            # Curated music library
├── documentation/        # This documentation
└── .env.local           # Environment variables
```

---

## Getting Started

1. Read the [Setup Guide](./05-SETUP-GUIDE.md) for local development
2. Review the [End-to-End Flow](./01-END-TO-END-FLOW.md) to understand the application
3. Check the [API Reference](./04-API-REFERENCE.md) for integration details
4. Follow the [Deployment Guide](./06-DEPLOYMENT-GUIDE.md) for production setup

---

## Support

For issues or questions:
- Check the documentation in this folder
- Review the code comments in `src/lib/` files
- Test with feature flags (see `.env.local`)

---

**Last Updated**: January 14, 2026
