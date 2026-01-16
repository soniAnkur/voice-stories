# Voice Bedtime Tales

**Your Voice, Their Dreams**

Personalized bedtime stories narrated in a parent's cloned voice, generated with AI and mixed with calming background music.

---

## Quick Links

- **📖 [User Guide](./ABOUT.md)** - How to use Voice Bedtime Tales
- **📚 [Technical Documentation](./documentation/README.md)** - Complete developer documentation

---

## What is Voice Bedtime Tales?

Voice Bedtime Tales creates personalized bedtime stories where:
- 🎙️ **Your voice** narrates the story (cloned using ElevenLabs)
- 👧 **Your child** is the main character
- ✨ **AI generates** unique stories tailored to their interests
- 🎵 **Background music** creates a calming atmosphere
- 💤 **Slow narration** (0.7x speed) helps induce sleep

---

## Quick Start

### For Users

1. Visit the application
2. Enter your email
3. Record your voice (30-60 seconds)
4. Enter child's details (name, age, interests)
5. Generate preview story (30 seconds)
6. Get full story (10 minutes)

See [ABOUT.md](./ABOUT.md) for detailed user guide.

### For Developers

**Prerequisites**: Node.js 20.x, MongoDB, FFmpeg

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run locally
npm run dev
```

See [documentation/05-SETUP-GUIDE.md](./documentation/05-SETUP-GUIDE.md) for complete setup instructions.

---

## Technical Documentation

Complete technical documentation is available in the [`documentation/`](./documentation/) folder:

1. **[End-to-End Application Flow](./documentation/01-END-TO-END-FLOW.md)**
   - Complete user journey from email entry to story playback
   - Data flows and system interactions

2. **[Technical Architecture](./documentation/02-TECHNICAL-ARCHITECTURE.md)**
   - System architecture overview
   - Technology stack and external services
   - Database models and file storage

3. **[Story Generation Pipeline](./documentation/03-STORY-GENERATION-PIPELINE.md)**
   - Story composition (Google Gemini)
   - Music generation and selection
   - Voice narration (ElevenLabs)
   - Audio mixing (FFmpeg)

4. **[API Reference](./documentation/04-API-REFERENCE.md)**
   - All API endpoints
   - Request/response formats
   - Error handling

5. **[Setup Guide](./documentation/05-SETUP-GUIDE.md)**
   - Local development setup
   - Environment variables
   - Dependencies installation

6. **[Deployment Guide](./documentation/06-DEPLOYMENT-GUIDE.md)**
   - Vercel deployment
   - MongoDB Atlas setup
   - FFmpeg API server setup
   - Production configuration

---

## Technology Stack

### Frontend
- **Next.js 16.1.1** with Turbopack
- **React 19**
- **TypeScript 5.7.3**
- **Tailwind CSS 4**

### Backend
- **MongoDB** with Mongoose
- **Cloudflare R2** (S3-compatible storage)
- **Stripe** (payments)

### External APIs
- **Google Gemini 2.0 Flash** - Story generation
- **ElevenLabs API v3** - Voice cloning & TTS
- **Mubert API** - AI music generation (optional)
- **FFmpeg** - Audio mixing

---

## Project Structure

```
voice_stories/
├── documentation/          # Complete technical documentation
│   ├── README.md
│   ├── 01-END-TO-END-FLOW.md
│   ├── 02-TECHNICAL-ARCHITECTURE.md
│   ├── 03-STORY-GENERATION-PIPELINE.md
│   ├── 04-API-REFERENCE.md
│   ├── 05-SETUP-GUIDE.md
│   └── 06-DEPLOYMENT-GUIDE.md
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   ├── checkout/     # Stripe checkout
│   │   ├── library/      # Story library
│   │   ├── preview/      # Story preview
│   │   └── page.tsx      # Home page
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
├── ABOUT.md              # User guide
├── README.md             # This file
└── .env.local           # Environment variables
```

---

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/voice_stories

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=

# APIs
ELEVENLABS_API_KEY=
GEMINI_API_KEY=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# FFmpeg API (optional)
FFMPEG_API_URL=
FFMPEG_API_KEY=
```

---

## Features

- ✅ Voice cloning from 30-60 second sample
- ✅ AI-generated personalized stories
- ✅ Age-appropriate content (2-10 years)
- ✅ Background music (AI-generated or curated)
- ✅ Professional audio mixing with ducking
- ✅ 30-second preview + 10-minute full story
- ✅ Payment gateway (Stripe)
- ✅ Story library organized by voice

---

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Deployment

Deploy to Vercel:

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

See [Deployment Guide](./documentation/06-DEPLOYMENT-GUIDE.md) for complete instructions.

---

## Contributing

This is a proprietary project. Please contact the project owner for contribution guidelines.

---

## License

All rights reserved.

---

## Support

- **Documentation**: See [`documentation/`](./documentation/) folder
- **User Guide**: See [ABOUT.md](./ABOUT.md)
- **Issues**: Contact project owner

---

**Last Updated**: January 14, 2026
