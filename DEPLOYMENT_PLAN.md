# Vercel Deployment Plan for Voice Bedtime Tales

## Overview
Deploy Next.js app to Vercel with Cloudflare R2 for storage and a VPS-based FFmpeg API for audio processing.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Vercel     │────▶│ Cloudflare   │◀────│    VPS      │
│  (Next.js)  │     │     R2       │     │  (FFmpeg)   │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                    │
      │  1. Upload         │                    │
      │  narration ───────▶│                    │
      │                    │                    │
      │  2. POST /mix ─────┼───────────────────▶│
      │  {narrationUrl,    │                    │
      │   musicUrl}        │  3. Download ◀─────│
      │                    │                    │
      │                    │  4. FFmpeg mix     │
      │                    │                    │
      │                    │  5. Upload ◀───────│
      │                    │     mixed.mp3      │
      │  6. Return         │                    │
      │◀───────────────────┼────────────────────│
      │  {mixedUrl}        │                    │
```

## Prerequisites
- [x] Vercel CLI installed
- [x] Vercel Pro plan
- [x] VPS available
- [ ] Cloudflare account (for R2)
- [ ] Stripe - skipped for initial deployment

---

## Part A: Cloudflare R2 Setup

### A.1 Create R2 Bucket
1. Go to: https://dash.cloudflare.com → R2
2. Create bucket: `voice-stories`
3. Settings → CORS policy:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### A.2 Create API Token
1. R2 → Manage R2 API Tokens → Create API Token
2. Permissions: Object Read & Write
3. Specify bucket: `voice-stories`
4. Save the credentials:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ENDPOINT` (format: `https://<account-id>.r2.cloudflarestorage.com`)
   - `R2_BUCKET_NAME=voice-stories`

### A.3 Optional: Public Access
For serving audio files directly:
1. R2 → Bucket → Settings → Public access
2. Enable and note the public URL: `https://pub-xxx.r2.dev`

Or use R2 custom domain for cleaner URLs.

---

## Part B: VPS FFmpeg API Setup

### B.1 Install Dependencies on VPS
```bash
# SSH into VPS
ssh user@your-vps-ip

# Install FFmpeg
sudo apt update
sudo apt install -y ffmpeg

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create project directory
mkdir -p ~/ffmpeg-api
cd ~/ffmpeg-api
npm init -y
npm install express @aws-sdk/client-s3 @aws-sdk/lib-storage uuid cors
```

### B.2 Create FFmpeg API Server

**File: `~/ffmpeg-api/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { spawn } = require('child_process');
const { writeFile, readFile, unlink, mkdir } = require('fs/promises');
const { join } = require('path');
const { tmpdir } = require('os');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// R2 Client (S3-compatible)
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const API_KEY = process.env.FFMPEG_API_KEY;

// Auth middleware
const authenticate = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ffmpeg: true });
});

// Mix audio endpoint
app.post('/mix', authenticate, async (req, res) => {
  const {
    narrationKey,      // R2 key for narration file
    musicKey,          // R2 key for music file
    outputKey,         // R2 key for output
    musicVolume = 0.15,
    fadeIn = 2,
    fadeOut = 3,
    ducking = true,
    dreamyEffect = true,
  } = req.body;

  const sessionId = uuidv4();
  const tempDir = join(tmpdir(), 'ffmpeg-mix', sessionId);
  await mkdir(tempDir, { recursive: true });

  const narrationPath = join(tempDir, 'narration.mp3');
  const musicPath = join(tempDir, 'music.mp3');
  const outputPath = join(tempDir, 'output.mp3');

  try {
    // Download files from R2
    await downloadFromR2(narrationKey, narrationPath);
    await downloadFromR2(musicKey, musicPath);

    // Get duration
    const duration = await getAudioDuration(narrationPath);

    // Build FFmpeg filter
    const filter = buildMixFilter({
      duration, musicVolume, fadeIn, fadeOut, ducking, dreamyEffect
    });

    // Run FFmpeg
    await runFFmpeg([
      '-i', narrationPath,
      '-i', musicPath,
      '-filter_complex', filter,
      '-map', '[final]',
      '-acodec', 'libmp3lame',
      '-b:a', '192k',
      '-y',
      outputPath,
    ]);

    // Upload result to R2
    const outputBuffer = await readFile(outputPath);
    await uploadToR2(outputKey, outputBuffer, 'audio/mpeg');

    // Cleanup
    await cleanup([narrationPath, musicPath, outputPath, tempDir]);

    res.json({
      success: true,
      outputKey,
      duration,
    });
  } catch (error) {
    console.error('Mix error:', error);
    await cleanup([narrationPath, musicPath, outputPath, tempDir]);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function downloadFromR2(key, destPath) {
  const { Body } = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of Body) chunks.push(chunk);
  await writeFile(destPath, Buffer.concat(chunks));
}

async function uploadToR2(key, buffer, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    let output = '';
    ffprobe.stdout.on('data', (data) => output += data.toString());
    ffprobe.on('close', (code) => {
      if (code === 0) resolve(parseFloat(output.trim()) || 0);
      else reject(new Error(`ffprobe failed with code ${code}`));
    });
    ffprobe.on('error', reject);
  });
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => stderr += data.toString());
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed: ${stderr}`));
    });
    ffmpeg.on('error', reject);
  });
}

function buildMixFilter({ duration, musicVolume, fadeIn, fadeOut, ducking, dreamyEffect }) {
  const fadeOutStart = Math.max(0, duration - fadeOut);

  const dreamyFilter = dreamyEffect
    ? 'lowpass=f=8000,aecho=0.8:0.5:100|200|300:0.5|0.35|0.2,aecho=0.8:0.4:500|700:0.3|0.2,'
    : '';

  if (ducking) {
    return [
      `[0:a]${dreamyFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
      `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${duration}[musicloop]`,
      `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}[musicfaded]`,
      `[musicfaded][voice]sidechaincompress=threshold=0.02:ratio=4:attack=50:release=400:level_sc=0.5[musicducked]`,
      `[voice][musicducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
    ].join(';');
  }

  return [
    `[0:a]${dreamyFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
    `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${duration}[musicloop]`,
    `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}[musicfaded]`,
    `[voice][musicfaded]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
  ].join(';');
}

async function cleanup(paths) {
  for (const p of paths) {
    try { await unlink(p); } catch {}
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FFmpeg API running on port ${PORT}`);
});
```

### B.3 Create Environment File on VPS

**File: `~/ffmpeg-api/.env`**

```bash
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=voice-stories
FFMPEG_API_KEY=generate-a-secure-random-key
PORT=3001
```

### B.4 Run with PM2 (Production)

```bash
npm install -g pm2
pm2 start server.js --name ffmpeg-api
pm2 save
pm2 startup
```

### B.5 Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/ffmpeg-api
```

```nginx
server {
    listen 80;
    server_name your-vps-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long audio processing
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ffmpeg-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Add SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-vps-domain.com
```

---

## Part C: Update Vercel App

### C.1 Create R2 Client

**File: `src/lib/r2.ts`** (new file)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  // Return public URL or signed URL
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 86400 });
}

export async function getR2Url(key: string): Promise<string> {
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 86400 });
}

export { r2, BUCKET };
```

### C.2 Create FFmpeg API Client

**File: `src/lib/ffmpegApi.ts`** (new file)

```typescript
const FFMPEG_API_URL = process.env.FFMPEG_API_URL!;
const FFMPEG_API_KEY = process.env.FFMPEG_API_KEY!;

export interface MixRequest {
  narrationKey: string;
  musicKey: string;
  outputKey: string;
  musicVolume?: number;
  fadeIn?: number;
  fadeOut?: number;
  ducking?: boolean;
  dreamyEffect?: boolean;
}

export interface MixResponse {
  success: boolean;
  outputKey: string;
  duration: number;
}

export async function mixAudio(request: MixRequest): Promise<MixResponse> {
  const response = await fetch(`${FFMPEG_API_URL}/mix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': FFMPEG_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'FFmpeg API error');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${FFMPEG_API_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
```

### C.3 Update Audio Mix Route

**File: `src/app/api/audio/mix/route.ts`** (modify)

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { getBackgroundMusic } from "@/lib/music";
import { uploadToR2, getR2Url } from "@/lib/r2";
import { mixAudio } from "@/lib/ffmpegApi";

export async function POST(request: Request) {
  try {
    const { storyId, musicVolume = 0.15, enableDucking = true } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: "storyId required" }, { status: 400 });
    }

    await connectDB();

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (!story.fullAudioUrl) {
      return NextResponse.json({ error: "Story audio not generated yet" }, { status: 400 });
    }

    // Get background music
    const { url: musicUrl, source: musicSource } = await getBackgroundMusic(
      story.theme || "adventure",
      story.backgroundMusicPrompt,
      300
    );

    // Download narration and upload to R2
    const narrationResponse = await fetch(story.fullAudioUrl);
    const narrationBuffer = Buffer.from(await narrationResponse.arrayBuffer());
    const narrationKey = `stories/${storyId}/narration.mp3`;
    await uploadToR2(narrationBuffer, narrationKey, 'audio/mpeg');

    // Download music and upload to R2
    const musicResponse = await fetch(musicUrl);
    const musicBuffer = Buffer.from(await musicResponse.arrayBuffer());
    const musicKey = `stories/${storyId}/music.mp3`;
    await uploadToR2(musicBuffer, musicKey, 'audio/mpeg');

    // Call VPS FFmpeg API
    const outputKey = `stories/${storyId}/mixed.mp3`;
    const result = await mixAudio({
      narrationKey,
      musicKey,
      outputKey,
      musicVolume,
      ducking: enableDucking,
      dreamyEffect: true,
    });

    // Get public URLs for all artifacts
    const [narrationUrl, musicFileUrl, mixedUrl] = await Promise.all([
      getR2Url(narrationKey),
      getR2Url(musicKey),
      getR2Url(outputKey),
    ]);

    // Update story with all URLs
    await Story.findByIdAndUpdate(storyId, {
      narrationUrl,           // Original narration
      backgroundMusicUrl: musicFileUrl,  // Background music used
      fullAudioUrl: mixedUrl,            // Final mixed audio
      musicSource,
      hasMusicMixed: true,
      audioDuration: result.duration,
    });

    return NextResponse.json({
      success: true,
      narrationUrl,
      backgroundMusicUrl: musicFileUrl,
      mixedAudioUrl: mixedUrl,
      musicSource,
      duration: result.duration,
    });
  } catch (error) {
    console.error("Error mixing audio:", error);
    return NextResponse.json({ error: "Failed to mix audio" }, { status: 500 });
  }
}
```

### C.4 Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Part D: Environment Variables

### Vercel Dashboard (Project → Settings → Environment Variables)

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | Auto-set | Via Vercel MongoDB integration |
| `ELEVENLABS_API_KEY` | From .env.local | Voice cloning |
| `GEMINI_API_KEY` | From .env.local | Story generation |
| `R2_ENDPOINT` | `https://<id>.r2.cloudflarestorage.com` | Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | From Cloudflare | R2 API token |
| `R2_SECRET_ACCESS_KEY` | From Cloudflare | R2 API token |
| `R2_BUCKET_NAME` | `voice-stories` | Bucket name |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` | Optional public URL |
| `FFMPEG_API_URL` | `https://your-vps.com` | VPS endpoint |
| `FFMPEG_API_KEY` | Shared secret | Auth for VPS |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | App URL |

---

## Part E: Git & Deploy

### E.1 Review .gitignore
Already configured - no changes needed.

### E.2 Initialize Git & Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Voice Bedtime Tales"
gh repo create voice-stories --private --source=. --push
```

### E.3 Deploy to Vercel
```bash
vercel link
vercel --prod
```

---

## Part F: Data Migration

### F.1 Export Local MongoDB
```bash
mongodump --db voice_stories --out ./backup
```

### F.2 Import to Atlas
```bash
mongorestore --uri "$ATLAS_URI" --db voice_stories ./backup/voice_stories
```

### F.3 Migrate Existing Audio Files
If stories have local audio in `/public/uploads/`, write a migration script to upload to R2.

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/r2.ts` | **Create** - R2 client |
| `src/lib/ffmpegApi.ts` | **Create** - VPS API client |
| `src/app/api/audio/mix/route.ts` | **Modify** - Use R2 + VPS |
| `src/lib/audioMixer.ts` | **Keep** - For reference/fallback |
| `package.json` | **Modify** - Add @aws-sdk packages |
| VPS: `server.js` | **Create** - FFmpeg API |

---

## Testing

### Test VPS FFmpeg API
```bash
curl https://your-vps.com/health

curl -X POST https://your-vps.com/mix \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "narrationKey": "test/narration.mp3",
    "musicKey": "test/music.mp3",
    "outputKey": "test/mixed.mp3"
  }'
```

### Test Vercel Integration
```bash
curl -X POST https://your-app.vercel.app/api/audio/mix \
  -H "Content-Type: application/json" \
  -d '{"storyId": "existing-story-id"}'
```

---

## Benefits of This Architecture

1. **All artifacts preserved in R2** - narration, music, mixed audio
2. **Free egress** - R2 doesn't charge for bandwidth
3. **Vercel stays lightweight** - no FFmpeg binary bloat
4. **Reliable processing** - VPS has full FFmpeg capabilities
5. **Debuggable** - can inspect each file in R2
6. **Scalable** - can add more VPS nodes if needed
