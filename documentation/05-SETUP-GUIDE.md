# Setup Guide

Complete guide for setting up the Voice Bedtime Tales application for local development.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [FFmpeg Setup](#ffmpeg-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20.x | Runtime environment |
| **npm** | 10.x | Package manager |
| **MongoDB** | 6.0+ | Local database (optional) |
| **FFmpeg** | 4.0+ | Audio processing |
| **Git** | Any | Version control |

### Installation Links

- **Node.js**: https://nodejs.org/ (Download LTS version)
- **MongoDB**: https://www.mongodb.com/try/download/community (or use MongoDB Atlas)
- **FFmpeg**:
  - macOS: `brew install ffmpeg`
  - Windows: https://ffmpeg.org/download.html
  - Linux: `sudo apt-get install ffmpeg`

### Verify Installations

```bash
node --version    # Should show v20.x
npm --version     # Should show 10.x
mongod --version  # Should show 6.0+
ffmpeg -version   # Should show 4.0+
```

---

## Installation

### 1. Clone Repository

```bash
cd /Users/ankursoni/2026
git clone <repository-url> voice_stories
cd voice_stories
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages from `package.json`:
- Next.js 16.1.1
- React 19
- Mongoose 9.1.1
- AWS SDK (for R2)
- Stripe
- TypeScript
- Tailwind CSS 4

**Expected output**:
```
added 450 packages in 30s
```

### 3. Install FFmpeg API Dependencies (Optional)

If you want to run the remote FFmpeg API locally:

```bash
cd ffmpeg-api
npm install
cd ..
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your actual credentials:

```bash
# MongoDB
# Local development (default)
MONGODB_URI=mongodb://localhost:27017/voice_stories

# Production (uncomment to use)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voice_stories?retryWrites=true&w=majority

# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# ElevenLabs API
ELEVENLABS_API_KEY=sk_xxxxx

# Google Gemini API
GEMINI_API_KEY=AIzaSyXXXXX

# Stripe (Optional - can bypass with feature flag)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_PRICE_ID=price_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# FFmpeg API (Optional - leave empty for local FFmpeg)
FFMPEG_API_URL=
FFMPEG_API_KEY=

# Feature Flags (Development)
BYPASS_PAYMENT=true          # Skip Stripe payment
MOCK_STORY_GENERATION=false  # Use mock stories
```

### 3. Get API Keys

#### Google Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy key to `GEMINI_API_KEY`

#### ElevenLabs API Key
1. Sign up at https://elevenlabs.io/
2. Go to Profile → API Key
3. Copy key to `ELEVENLABS_API_KEY`

#### Cloudflare R2
1. Log in to Cloudflare Dashboard
2. Go to R2 → Manage R2 API Tokens
3. Create API token with read/write permissions
4. Copy credentials to env file

#### Stripe (Optional)
1. Sign up at https://stripe.com/
2. Get test keys from Dashboard → Developers → API Keys
3. Copy keys to env file
4. Or set `BYPASS_PAYMENT=true` to skip

---

## Database Setup

### Option A: Local MongoDB

#### 1. Start MongoDB

```bash
# macOS/Linux
mongod --dbpath ~/data/db

# Windows
mongod.exe --dbpath C:\data\db
```

#### 2. Verify Connection

```bash
mongosh mongodb://localhost:27017
```

You should see:
```
Current Mongosh Log ID: xxxxx
Connecting to: mongodb://localhost:27017
test>
```

#### 3. Create Database (Auto-created on first use)

The application will automatically create the `voice_stories` database and collections on first API call.

**Collections Created**:
- `users`
- `stories`

### Option B: MongoDB Atlas (Cloud)

#### 1. Create Cluster

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Set up database user
4. Whitelist IP: 0.0.0.0/0 (allow all) for development

#### 2. Get Connection String

1. Click "Connect" → "Connect your application"
2. Copy connection string
3. Replace `<password>` with your password
4. Update `MONGODB_URI` in `.env.local`

---

## Running Locally

### 1. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.x.x:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 538ms
```

### 2. Open Browser

Navigate to: http://localhost:3000

You should see the Voice Bedtime Tales home page.

### 3. Test Application Flow

**Step 1**: Enter your email
**Step 2**: Record voice sample (30-60 seconds)
**Step 3**: Enter child details
**Step 4**: Click "Generate Preview Story"
**Step 5**: Listen to 30-second preview
**Step 6**: Click "Generate Full Story" (payment bypassed if flag set)
**Step 7**: Listen to 10-minute story

---

## FFmpeg Setup

### Local FFmpeg (Development)

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

#### Windows
1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add to PATH: `C:\ffmpeg\bin`

#### Verify Installation
```bash
ffmpeg -version
ffprobe -version
```

### Remote FFmpeg API (Optional)

If you want to test the remote API locally:

#### 1. Start FFmpeg API Server

```bash
cd ffmpeg-api
node index.js
```

**Expected output**:
```
FFmpeg API Server running on port 8080
FFmpeg version: 4.4.2
```

#### 2. Expose with Tunnel (LocalTunnel or ngrok)

**LocalTunnel**:
```bash
npx localtunnel --port 8080
```

**ngrok**:
```bash
ngrok http 8080
```

#### 3. Update Environment

```bash
FFMPEG_API_URL=https://your-tunnel-url.loca.lt
FFMPEG_API_KEY=ffmpeg-api-secret-key-2026
```

---

## Testing

### Test Story Generation

#### With Mock Stories (Fast)
```bash
# In .env.local
MOCK_STORY_GENERATION=true
```

Stories generate instantly with pre-written content.

#### With Real APIs (Slow)
```bash
# In .env.local
MOCK_STORY_GENERATION=false
```

Uses actual Gemini and ElevenLabs APIs.

### Test Payment Flow

#### Bypass Payment (Development)
```bash
# In .env.local
BYPASS_PAYMENT=true
```

Full story generates immediately without Stripe.

#### With Stripe (Production)
```bash
# In .env.local
BYPASS_PAYMENT=false
```

Uses Stripe test mode. Test card: `4242 4242 4242 4242`

### Test Database

#### View Collections
```bash
mongosh mongodb://localhost:27017/voice_stories
```

```javascript
// List all users
db.users.find().pretty()

// List all stories
db.stories.find().pretty()

// Count documents
db.users.countDocuments()
db.stories.countDocuments()
```

### Test File Storage

Check Cloudflare R2 dashboard:
1. Go to R2 → Buckets → kids-storybooks-images
2. Navigate to voice-stories/ folder
3. Verify files are uploading

---

## Troubleshooting

### MongoDB Connection Failed

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
```bash
# Start MongoDB
mongod --dbpath ~/data/db

# Or update MONGODB_URI to MongoDB Atlas
```

### FFmpeg Not Found

**Error**: `Error: spawn ffmpeg ENOENT`

**Solution**:
```bash
# Install FFmpeg
brew install ffmpeg  # macOS

# Or set FFMPEG_API_URL to use remote API
```

### ElevenLabs API Error

**Error**: `Failed to clone voice: 401 Unauthorized`

**Solution**:
- Verify `ELEVENLABS_API_KEY` is correct
- Check API quota at https://elevenlabs.io/

### Gemini API Quota Exceeded

**Error**: `Failed to generate story: 429 Too Many Requests`

**Solution**:
- Wait for quota reset
- Or set `MOCK_STORY_GENERATION=true`

### R2 Upload Failed

**Error**: `Failed to upload audio: Access Denied`

**Solution**:
- Verify R2 credentials are correct
- Check bucket name matches
- Ensure API token has write permissions

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

### Build Errors

**Error**: `Module not found` or TypeScript errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

---

## Development Tools

### Recommended VS Code Extensions

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Tailwind autocomplete
- **MongoDB for VS Code**: Database explorer

### Useful Commands

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# TypeScript type checking
npx tsc --noEmit
```

### Debug Mode

Add to `.env.local`:
```bash
DEBUG=*
NODE_ENV=development
```

---

## Next Steps

1. **Complete Setup**: Ensure all environment variables are configured
2. **Test Flow**: Walk through entire story generation flow
3. **Check Database**: Verify users and stories are saving
4. **Review Logs**: Check console for any errors
5. **Read API Docs**: Review [API Reference](./04-API-REFERENCE.md)
6. **Deploy**: Follow [Deployment Guide](./06-DEPLOYMENT-GUIDE.md)

---

**Last Updated**: January 14, 2026
