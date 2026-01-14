# FFmpeg Deployment Options for Vercel

## The Problem

Vercel serverless functions have a **50MB size limit**, and FFmpeg binaries typically exceed this limit. This project uses FFmpeg for professional audio processing:

- **Narration + Music Mixing** with volume ducking
- **Dreamy Effects**: lowpass filter, echo, reverb
- **Loudness Normalization** to broadcast standards (-16 LUFS)
- **MP3 Encoding** at 192kbps

The core FFmpeg integration is in `src/lib/audioMixer.ts` (346 lines).

---

## Research Sources

| Source | URL |
|--------|-----|
| Vercel FFmpeg Discussion | https://github.com/vercel/vercel/discussions/9729 |
| Vercel Labs FFmpeg Demo | https://github.com/vercel-labs/ffmpeg-on-vercel |
| Trigger.dev FFmpeg Guide | https://trigger.dev/docs/guides/examples/ffmpeg-video-processing |
| FFmpeg API (Cloud Service) | https://ffmpeg-api.com/ |
| Rendi FFmpeg API | https://www.rendi.dev/ |
| Railway FFmpeg REST API | https://railway.com/deploy/ffmpeg-rest-api |
| FastAPI FFmpeg Microservice | https://github.com/rendiffdev/ffmpeg-api/ |

---

## Option 1: Vercel Native with `ffmpeg-static`

### Overview
Vercel Labs has an official example showing FFmpeg running natively on Vercel's Fluid compute using the `ffmpeg-static` npm package.

### How It Works
1. Install `ffmpeg-static` package which bundles FFmpeg binaries
2. Declare the binary in `next.config.ts` so it gets included in the deployed function
3. Allocate higher memory (3GB+ recommended) in `vercel.json`

### Configuration

**next.config.ts:**
```typescript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ffmpeg-static'],
  },
};
```

**vercel.json:**
```json
{
  "functions": {
    "app/api/audio/mix/route.ts": {
      "memory": 3009
    },
    "app/api/story/preview/route.ts": {
      "memory": 3009
    },
    "app/api/story/full/route.ts": {
      "memory": 3009
    }
  }
}
```

### Pros
- No external infrastructure needed
- Official Vercel support
- Simple deployment - just add package and config

### Cons
- **Higher Vercel costs** - CPU-bound workloads charge more
- **May require Pro plan** - free tier users reported issues
- **Cold starts can be slow** - large binary to load
- **50MB limit risk** - may still hit limits with other dependencies

### Best For
- Small-scale projects
- Vercel Pro plan users
- Projects where simplicity is paramount

---

## Option 2: Self-Hosted FFmpeg Microservice on VPS (Recommended)

### Overview
Deploy a dedicated FFmpeg REST API on your existing VPS, call it from Vercel via HTTP.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐                      ┌──────────────────────────┐ │
│  │  Vercel          │                      │  Your VPS                │ │
│  │  (Next.js App)   │                      │  (FFmpeg API)            │ │
│  │                  │                      │                          │ │
│  │  1. Generate TTS │                      │  4. Download audio files │ │
│  │     (ElevenLabs) │                      │     from R2              │ │
│  │                  │                      │                          │ │
│  │  2. Upload       │   HTTP POST          │  5. Process with FFmpeg  │ │
│  │     narration    │──────────────────────▶│     - Mix audio         │ │
│  │     to R2        │   /api/mix           │     - Apply effects      │ │
│  │                  │   {narrationUrl,     │     - Normalize          │ │
│  │  3. Call FFmpeg  │    musicUrl,         │                          │ │
│  │     API          │    options}          │  6. Upload result to R2  │ │
│  │                  │                      │                          │ │
│  │  7. Receive      │◀──────────────────────│  7. Return mixed URL    │ │
│  │     mixed URL    │   {mixedUrl}         │                          │ │
│  │                  │                      │                          │ │
│  │  8. Save to DB   │                      │                          │ │
│  │     & return     │                      │                          │ │
│  └──────────────────┘                      └──────────────────────────┘ │
│           │                                           │                  │
│           │                                           │                  │
│           ▼                                           ▼                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        Cloudflare R2                               │ │
│  │                                                                    │ │
│  │   /voice-stories/                                                  │ │
│  │     ├── voice-samples/           (user voice recordings)          │ │
│  │     ├── stories/preview/         (30-second previews)             │ │
│  │     ├── stories/full/            (full 10-minute stories)         │ │
│  │     └── temp/                    (temporary processing files)     │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### VPS API Implementation

**Project Structure:**
```
ffmpeg-api/
├── package.json
├── index.js              # Express server entry point
├── routes/
│   ├── mix.js            # POST /api/mix - audio mixing
│   ├── normalize.js      # POST /api/normalize - loudness normalization
│   └── health.js         # GET /api/health - health check
├── lib/
│   ├── ffmpeg.js         # FFmpeg processing functions
│   ├── r2.js             # Cloudflare R2 client
│   └── auth.js           # API key authentication
├── .env
└── Dockerfile            # Optional containerization
```

**package.json:**
```json
{
  "name": "ffmpeg-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@aws-sdk/client-s3": "^3.400.0",
    "uuid": "^9.0.0"
  }
}
```

**index.js:**
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mixRoute } from './routes/mix.js';
import { healthRoute } from './routes/health.js';
import { authMiddleware } from './lib/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS - allow only your Vercel domain
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000'
  ]
}));

app.use(express.json({ limit: '50mb' }));

// Health check (no auth)
app.use('/api/health', healthRoute);

// Protected routes
app.use('/api/mix', authMiddleware, mixRoute);

app.listen(PORT, () => {
  console.log(`FFmpeg API running on port ${PORT}`);
});
```

**lib/auth.js:**
```javascript
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.API_KEY;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}
```

**routes/mix.js:**
```javascript
import express from 'express';
import { mixNarrationWithMusic } from '../lib/ffmpeg.js';
import { downloadFromR2, uploadToR2 } from '../lib/r2.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const mixRoute = express.Router();

mixRoute.post('/', async (req, res) => {
  const {
    narrationUrl,
    musicUrl,
    musicVolume = 0.25,
    ducking = true,
    duckingAmount = 0.5,
    fadeInDuration = 2,
    fadeOutDuration = 3,
  } = req.body;

  if (!narrationUrl || !musicUrl) {
    return res.status(400).json({ error: 'narrationUrl and musicUrl are required' });
  }

  const tempDir = path.join(os.tmpdir(), uuidv4());

  try {
    await fs.mkdir(tempDir, { recursive: true });

    // Download files from R2
    const narrationPath = path.join(tempDir, 'narration.mp3');
    const musicPath = path.join(tempDir, 'music.mp3');
    const outputPath = path.join(tempDir, 'mixed.mp3');

    await Promise.all([
      downloadFromR2(narrationUrl, narrationPath),
      downloadFromR2(musicUrl, musicPath),
    ]);

    // Process with FFmpeg
    await mixNarrationWithMusic({
      narrationPath,
      musicPath,
      outputPath,
      musicVolume,
      ducking,
      duckingAmount,
      fadeInDuration,
      fadeOutDuration,
    });

    // Upload result to R2
    const outputBuffer = await fs.readFile(outputPath);
    const mixedUrl = await uploadToR2(outputBuffer, `voice-stories/temp/mixed-${uuidv4()}.mp3`);

    res.json({ success: true, mixedUrl });

  } catch (error) {
    console.error('Mix error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});
```

**lib/ffmpeg.js:**
```javascript
import { spawn } from 'child_process';
import fs from 'fs/promises';

export async function mixNarrationWithMusic(options) {
  const {
    narrationPath,
    musicPath,
    outputPath,
    musicVolume = 0.25,
    ducking = true,
    duckingAmount = 0.5,
    fadeInDuration = 2,
    fadeOutDuration = 3,
  } = options;

  // Get narration duration
  const duration = await getAudioDuration(narrationPath);
  const fadeOutStart = Math.max(0, duration - fadeOutDuration);

  // Build filter complex
  let filterComplex;

  if (ducking) {
    // Advanced filter with sidechain compression
    filterComplex = [
      // Apply dreamy effects to voice
      `[0:a]lowpass=f=8000,aecho=0.8:0.5:100|200|300:0.5|0.35|0.2,aecho=0.8:0.4:500|700:0.3|0.2,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
      // Loop and trim music
      `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${duration}[musicloop]`,
      // Apply volume and fades to music
      `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}[musicfaded]`,
      // Sidechain compression - duck music when voice is present
      `[musicfaded][voice]sidechaincompress=threshold=0.02:ratio=4:attack=50:release=400:level_sc=${duckingAmount}[musicducked]`,
      // Mix and normalize
      `[voice][musicducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
    ].join(';');
  } else {
    // Simple filter without ducking
    filterComplex = [
      `[0:a]lowpass=f=8000,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
      `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${duration}[musicloop]`,
      `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}[music]`,
      `[voice][music]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
    ].join(';');
  }

  const args = [
    '-i', narrationPath,
    '-i', musicPath,
    '-filter_complex', filterComplex,
    '-map', '[final]',
    '-acodec', 'libmp3lame',
    '-b:a', '192k',
    '-y',
    outputPath,
  ];

  await runFFmpeg(args);
}

function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath,
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => output += data);
    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('ffprobe failed'));
        return;
      }
      const info = JSON.parse(output);
      resolve(parseFloat(info.format.duration));
    });
  });
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => stderr += data);
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed: ${stderr}`));
      } else {
        resolve();
      }
    });
  });
}
```

**lib/r2.js:**
```javascript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { Readable } from 'stream';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

export async function downloadFromR2(url, localPath) {
  // Extract key from URL
  const key = url.replace(`${PUBLIC_URL}/`, '');

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const response = await r2Client.send(command);
  const stream = response.Body;

  // Write to file
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  await fs.writeFile(localPath, Buffer.concat(chunks));
}

export async function uploadToR2(buffer, key) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=31536000',
  });

  await r2Client.send(command);
  return `${PUBLIC_URL}/${key}`;
}
```

**.env (VPS):**
```bash
PORT=8080
API_KEY=your-super-secret-api-key-here

# Cloudflare R2 (same as voice_stories project)
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### VPS Deployment Commands

```bash
# SSH into your VPS
ssh user@your-vps.com

# Install Node.js if not present
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt-get update
sudo apt-get install -y ffmpeg

# Clone or create the project
mkdir -p ~/ffmpeg-api && cd ~/ffmpeg-api

# Install dependencies
npm install

# Create .env file with your credentials
nano .env

# Start with PM2 for production
npm install -g pm2
pm2 start index.js --name ffmpeg-api
pm2 save
pm2 startup
```

### Pros
- **Full control** over FFmpeg version and configuration
- **No size limits** - run any FFmpeg command
- **Cost-effective** - use existing VPS
- **Long-running jobs** - handle 20+ minute processing
- **Custom filter chains** - your exact audio processing pipeline

### Cons
- Need to maintain VPS
- Network latency between Vercel and VPS (~50-200ms)
- Need to handle security (API keys, rate limiting, CORS)
- VPS needs to be always available

### Best For
- You already have a VPS
- Need full control over processing
- Want to minimize cloud costs

---

## Option 3: Cloud FFmpeg API Services

### 3a. FFmpeg API (ffmpeg-api.com)

**Overview:** REST API for any FFmpeg command. No infrastructure to manage.

**Features:**
- Execute any FFmpeg command via HTTP
- FFprobe for media analysis
- AI-powered FFmpeg assistance
- Free credits to test

**Pricing:** Pay-as-you-go based on processing time

**Example Usage:**
```javascript
const response = await fetch('https://api.ffmpeg-api.com/v1/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'https://your-r2-url/narration.mp3',
    output_format: 'mp3',
    commands: [
      '-i', 'https://your-r2-url/music.mp3',
      '-filter_complex', '[0:a][1:a]amix=inputs=2[out]',
      '-map', '[out]',
    ],
  }),
});
```

**Website:** https://ffmpeg-api.com/

---

### 3b. Rendi (rendi.dev)

**Overview:** High-performance FFmpeg API with auto-scaling.

**Features:**
- Send FFmpeg commands as POST request
- High CPU/memory servers
- Faster than Lambda/Cloud Functions
- Supports 20+ minute jobs
- No egress/ingress fees

**Pricing:** No surprise costs, simple pricing

**Example Usage:**
```javascript
const response = await fetch('https://api.rendi.dev/v1/run', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    command: 'ffmpeg -i input.mp3 -i music.mp3 -filter_complex amix output.mp3',
    inputs: {
      'input.mp3': 'https://your-r2-url/narration.mp3',
      'music.mp3': 'https://your-r2-url/music.mp3',
    },
  }),
});
```

**Website:** https://www.rendi.dev/

---

### Pros of Cloud APIs
- **No infrastructure** - fully managed
- **Auto-scaling** - handles traffic spikes
- **Fast servers** - optimized for FFmpeg

### Cons of Cloud APIs
- **Recurring costs** - pay per request/minute
- **Third-party dependency** - data leaves your infrastructure
- **Less customization** - may not support all filter chains

### Best For
- Need to scale without infrastructure
- Don't have a VPS
- Want managed service

---

## Option 4: Trigger.dev (Background Jobs)

### Overview
Trigger.dev runs background tasks with FFmpeg build extension, integrates with Vercel deployments.

### How It Works
1. Add FFmpeg build extension to Trigger.dev config
2. Create tasks that use FFmpeg
3. Trigger.dev handles execution in isolated containers
4. Integrates with Vercel via webhook

### Configuration

**trigger.config.ts:**
```typescript
import { defineConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "voice-stories",
  build: {
    extensions: [ffmpeg()],
  },
});
```

**tasks/mixAudio.ts:**
```typescript
import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";

export const mixAudioTask = task({
  id: "mix-audio",
  run: async (payload: { narrationUrl: string; musicUrl: string }) => {
    // Download, process with FFmpeg, upload result
    // ...
    return { mixedUrl: "https://..." };
  },
});
```

### Pros
- Integrates with Vercel deployments
- Handles long-running jobs
- Built-in job queue and retries
- No container management

### Cons
- Another service to learn and manage
- Adds latency (job queue)
- Additional cost

### Best For
- Complex async workflows
- Need job queuing and retries
- Already using Trigger.dev

**Reference:** https://trigger.dev/docs/guides/examples/ffmpeg-video-processing

---

## Option 5: Alternative Platforms (Instead of Vercel)

If FFmpeg is critical and you want simpler deployment:

| Platform | FFmpeg Support | Notes |
|----------|----------------|-------|
| **Railway** | Pre-installed | One-click deploy, Docker support |
| **Render** | Docker support | Add FFmpeg in Dockerfile |
| **Fly.io** | Full VM access | Run any binary |
| **Google Cloud Functions** | Works in Node.js | Some size limits |
| **AWS Lambda** | Via layers | Complex setup |

---

## Recommendation Summary

| Option | Cost | Complexity | Best For |
|--------|------|------------|----------|
| Vercel Native | $$$ | Low | Small-scale, Pro plan users |
| **VPS Microservice** | **$** | **Medium** | **You have VPS, want control** |
| Cloud API | $$-$$$ | Low | Scale without infrastructure |
| Trigger.dev | $$ | Medium | Complex async workflows |
| Alt Platform | $ | Medium | FFmpeg is core feature |

---

## Selected Approach: VPS Microservice

Based on your requirements:
- **Custom Express API** on your VPS
- **Keep local FFmpeg for development**
- **Remote FFmpeg for Vercel production**

### Voice Stories Code Changes Required

**Files to Modify:**

| File | Changes |
|------|---------|
| `.env.local` | Add `FFMPEG_API_URL`, `FFMPEG_API_KEY` |
| `src/lib/audioMixer.ts` | Add `mixNarrationWithMusicRemote()` function |

### Updated audioMixer.ts Logic

```typescript
export async function mixNarrationWithMusic(options: MixOptions): Promise<MixResult> {
  // 1. Try local FFmpeg first (for development)
  if (await isFFmpegAvailable()) {
    console.log('Using local FFmpeg');
    return mixNarrationWithMusicLocal(options);
  }

  // 2. Use remote FFmpeg API (for Vercel production)
  if (process.env.FFMPEG_API_URL) {
    console.log('Using remote FFmpeg API');
    return mixNarrationWithMusicRemote(options);
  }

  // 3. Fallback: return narration only (no mixing)
  console.warn('No FFmpeg available, returning narration only');
  return {
    success: false,
    buffer: options.narrationBuffer,
    error: 'FFmpeg not available'
  };
}
```

---

## Implementation Checklist

### Phase 1: VPS Setup
- [ ] SSH into VPS
- [ ] Install Node.js 20+
- [ ] Install FFmpeg
- [ ] Create ffmpeg-api project
- [ ] Configure .env with R2 credentials
- [ ] Start with PM2
- [ ] Test `/api/health` endpoint
- [ ] Test `/api/mix` endpoint

### Phase 2: Voice Stories Changes
- [ ] Add env variables to `.env.local`
- [ ] Add `mixNarrationWithMusicRemote()` to audioMixer.ts
- [ ] Update `mixNarrationWithMusic()` with fallback logic
- [ ] Test locally with FFmpeg
- [ ] Deploy to Vercel
- [ ] Test production with VPS API

### Phase 3: Security & Monitoring
- [ ] Set up CORS for Vercel domain only
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up health monitoring
- [ ] Configure alerts for failures

---

## Local Development with Localtunnel (Testing Setup)

For testing Vercel deployment without a VPS, you can run the FFmpeg API locally and expose it via **localtunnel**.

### Quick Start (After Restart)

Run this single command to start everything:

```bash
cd /Users/ankursoni/2026/voice_stories/ffmpeg-api && node index.js &
sleep 2 && npx localtunnel --port 8080
```

Or run them in separate terminals:

**Terminal 1 - Start FFmpeg API:**
```bash
cd /Users/ankursoni/2026/voice_stories/ffmpeg-api
node index.js
```

**Terminal 2 - Start Localtunnel:**
```bash
npx localtunnel --port 8080
```

### After Starting

1. Localtunnel will output a URL like: `https://xxxxx-xxxxx-xxxxx.loca.lt`
2. Update `.env.local` with the new URL:
   ```bash
   FFMPEG_API_URL=https://xxxxx-xxxxx-xxxxx.loca.lt
   ```
3. Restart your Next.js dev server or redeploy to Vercel

### Verify It's Working

```bash
# Test health endpoint
curl https://YOUR-LOCALTUNNEL-URL/api/health

# Expected response:
# {"status":"ok","ffmpeg":{"available":true,"version":"8.0"},...}
```

### Stop Everything

```bash
# Find and kill FFmpeg API
lsof -ti:8080 | xargs kill

# Localtunnel stops when you close its terminal or press Ctrl+C
```

### Important Notes

| Note | Details |
|------|---------|
| URL changes on restart | You'll get a new URL each time you start localtunnel |
| Mac must stay on | The tunnel only works while your Mac is running |
| For testing only | Use VPS or cloud API for production |
| No signup required | Unlike ngrok, localtunnel doesn't need an account |

### Alternative: Ngrok (Requires Free Account)

If you prefer ngrok (more stable URLs with paid plan):

1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure ngrok:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
4. Start ngrok:
   ```bash
   ngrok http 8080
   ```

---

## Current Setup Status

| Component | Location | Status |
|-----------|----------|--------|
| FFmpeg API Code | `ffmpeg-api/` | ✅ Ready |
| audioMixer.ts | `src/lib/audioMixer.ts` | ✅ Updated with remote support |
| Environment Variables | `.env.local` | ✅ Configured |
| API Key | `FFMPEG_API_KEY` | `ffmpeg-api-secret-key-2026` |

### Environment Variables Reference

**In `.env.local` (voice_stories):**
```bash
# FFmpeg API (VPS or Localtunnel) - for Vercel deployment
FFMPEG_API_URL=https://your-localtunnel-or-vps-url
FFMPEG_API_KEY=ffmpeg-api-secret-key-2026
```

**In `ffmpeg-api/.env`:**
```bash
PORT=8080
API_KEY=ffmpeg-api-secret-key-2026
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev
ALLOWED_ORIGINS=https://voice-stories.vercel.app,http://localhost:3000
```
