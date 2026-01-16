# Deployment Guide

Complete guide for deploying Voice Bedtime Tales to production.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Cloudflare R2 Setup](#cloudflare-r2-setup)
4. [Stripe Setup](#stripe-setup)
5. [FFmpeg VPS Setup](#ffmpeg-vps-setup)
6. [Vercel Deployment](#vercel-deployment)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)

---

## Deployment Overview

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────▶│  MongoDB     │────▶│ Cloudflare   │
│  Next.js App │     │  Atlas       │     │  R2 Storage  │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │
       ├──────▶ Google Gemini API
       ├──────▶ ElevenLabs API
       ├──────▶ Stripe API
       └──────▶ FFmpeg VPS (Optional)
```

### Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Cloudflare R2 bucket configured
- [ ] Stripe account set up (if using payments)
- [ ] FFmpeg VPS deployed (optional)
- [ ] Vercel project connected to Git
- [ ] Environment variables configured
- [ ] Domain configured (optional)
- [ ] SSL/HTTPS enabled
- [ ] Webhooks configured

---

## MongoDB Atlas Setup

### 1. Create Account & Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create new project: "Voice Bedtime Tales"
4. Create M0 cluster (free tier):
   - Cloud Provider: AWS
   - Region: Closest to your users
   - Cluster Name: "kids-storybooks"

### 2. Configure Database Access

1. **Database Access** → **Add New Database User**:
   - Username: `Vercel-Admin-kids-storybooks`
   - Password: Generate strong password
   - Role: `Atlas admin` or `Read and write to any database`

2. Save username and password securely.

### 3. Configure Network Access

1. **Network Access** → **Add IP Address**:
   - Option 1: `0.0.0.0/0` (Allow access from anywhere) - **For development/testing only**
   - Option 2: Whitelist Vercel's IP ranges - **For production**

**Vercel IP Ranges**: https://vercel.com/docs/concepts/edge-network/overview

### 4. Get Connection String

1. Click **Connect** → **Connect your application**
2. Driver: Node.js, Version: 4.0 or later
3. Copy connection string:
   ```
   mongodb+srv://Vercel-Admin-kids-storybooks:<password>@kids-storybooks.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with actual password
5. Add database name:
   ```
   mongodb+srv://Vercel-Admin-kids-storybooks:<password>@kids-storybooks.xxxxx.mongodb.net/voice_stories?retryWrites=true&w=majority
   ```

### 5. Create Database & Collections

Collections will be auto-created by the application on first use:
- `users`
- `stories`

Or create manually:
```javascript
use voice_stories
db.createCollection("users")
db.createCollection("stories")
```

### 6. Create Indexes (Recommended)

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ elevenlabsVoiceId: 1 })

// Stories collection
db.stories.createIndex({ userId: 1 })
db.stories.createIndex({ voiceId: 1 })
db.stories.createIndex({ status: 1 })
db.stories.createIndex({ createdAt: -1 })
```

---

## Cloudflare R2 Setup

### 1. Create R2 Bucket

1. Log in to Cloudflare Dashboard
2. Go to **R2** → **Create bucket**
3. Bucket name: `kids-storybooks-images`
4. Location: Automatic
5. Click **Create bucket**

### 2. Configure Public Access

1. Go to bucket → **Settings**
2. Enable **Public access**
3. Copy **Public R2.dev bucket URL**:
   ```
   https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev
   ```

### 3. Create API Token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Token name: "voice-stories-api"
4. Permissions:
   - Object Read
   - Object Write
5. **Optional**: Restrict to specific bucket
6. Click **Create API token**

### 4. Save Credentials

Copy these values to your environment:
- **Access Key ID**: `b1379badc1824d05f4e5bc4652c24649`
- **Secret Access Key**: `6f1a2fe4cb4f8f58a4f9517bce292e0b846d767f09a74f85d5c955f0ed9eb304`
- **Account ID**: `9c9a9319816153593660943ca6835bb9`
- **Bucket Name**: `kids-storybooks-images`
- **Public URL**: `https://pub-xxxxx.r2.dev`

### 5. Configure CORS (Optional)

If accessing from browser:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Stripe Setup

### 1. Create Stripe Account

1. Sign up at https://stripe.com/
2. Complete business verification
3. Enable test mode for testing

### 2. Create Product & Price

1. Go to **Products** → **Add product**
2. Product name: "Voice Bedtime Tales - Full Story"
3. Description: "10-minute personalized bedtime story"
4. Price: Set your price (e.g., $4.99)
5. Currency: USD
6. Billing: One-time payment
7. Save product and copy **Price ID**: `price_xxxxx`

### 3. Get API Keys

1. Go to **Developers** → **API keys**
2. Copy keys:
   - **Publishable key**: `pk_test_xxxxx` (Test mode)
   - **Secret key**: `sk_test_xxxxx` (Test mode)
3. For production: Toggle to "Live mode" and copy live keys

### 4. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/webhook`
4. Events to send:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy **Signing secret**: `whsec_xxxxx`

### 5. Test Payment Flow

Use test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

---

## FFmpeg VPS Setup

### Option 1: Skip FFmpeg API (Use Local)

Leave `FFMPEG_API_URL` empty. Audio mixing will happen in Vercel functions (limited to 10-second execution on free tier).

**Not recommended for production** due to timeout limits.

### Option 2: Deploy FFmpeg API to VPS

#### 1. Get VPS Server

Recommended providers:
- **DigitalOcean**: $6/month Droplet
- **Linode**: $5/month Nanode
- **Hetzner**: €4/month CX11

Specs:
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 1 vCPU
- **RAM**: 1-2 GB
- **Storage**: 25 GB

#### 2. Install Dependencies

SSH into server:
```bash
ssh root@your-server-ip
```

Install Node.js and FFmpeg:
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install FFmpeg
apt install -y ffmpeg

# Verify installations
node --version
npm --version
ffmpeg -version
```

#### 3. Deploy FFmpeg API

```bash
# Clone repository (or upload ffmpeg-api folder)
git clone <repository-url> voice_stories
cd voice_stories/ffmpeg-api

# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
FFMPEG_API_KEY=ffmpeg-api-secret-key-2026
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
EOF
```

#### 4. Run with PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start index.js --name ffmpeg-api

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

#### 5. Expose with Tunnel (Development)

For quick testing, use LocalTunnel:
```bash
npx localtunnel --port 8080
```

Copy the URL: `https://shaggy-queens-give.loca.lt`

#### 6. Set Up Reverse Proxy (Production)

**Install Nginx**:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

**Configure Nginx**:
```bash
cat > /etc/nginx/sites-available/ffmpeg-api <<EOF
server {
    listen 80;
    server_name ffmpeg.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF

ln -s /etc/nginx/sites-available/ffmpeg-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Get SSL Certificate**:
```bash
certbot --nginx -d ffmpeg.yourdomain.com
```

**Update Environment**:
```bash
FFMPEG_API_URL=https://ffmpeg.yourdomain.com
```

---

## Vercel Deployment

### 1. Connect Git Repository

1. Go to https://vercel.com/
2. Sign up / Log in with GitHub
3. Click **Add New** → **Project**
4. Import your Git repository
5. Select root directory

### 2. Configure Build Settings

Vercel auto-detects Next.js. Verify:
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 20.x

### 3. Add Environment Variables

In Vercel project settings, add all environment variables:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voice_stories?retryWrites=true&w=majority

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=b1379badc1824d05f4e5bc4652c24649
CLOUDFLARE_R2_SECRET_ACCESS_KEY=6f1a2fe4cb4f8f58a4f9517bce292e0b846d767f09a74f85d5c955f0ed9eb304
CLOUDFLARE_R2_ACCOUNT_ID=9c9a9319816153593660943ca6835bb9
CLOUDFLARE_R2_BUCKET_NAME=kids-storybooks-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-fdad8a04816c488a940287c7ac94f0e7.r2.dev

# APIs
ELEVENLABS_API_KEY=sk_xxxxx
GEMINI_API_KEY=AIzaSyXXXXX

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  # Use live key for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_PRICE_ID=price_xxxxx

# FFmpeg API (Optional)
FFMPEG_API_URL=https://ffmpeg.yourdomain.com
FFMPEG_API_KEY=ffmpeg-api-secret-key-2026

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Feature Flags (Production)
BYPASS_PAYMENT=false
MOCK_STORY_GENERATION=false
```

### 4. Deploy

Click **Deploy**. Vercel will:
1. Clone repository
2. Install dependencies
3. Build Next.js app
4. Deploy to edge network

**Deployment URL**: `https://your-project.vercel.app`

### 5. Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain: `voicebedtimetales.com`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## Post-Deployment

### 1. Update Stripe Webhook

Update webhook endpoint URL to production:
```
https://your-domain.vercel.app/api/webhook
```

### 2. Test Full Flow

1. Visit production URL
2. Enter email
3. Record voice
4. Generate preview story
5. Complete payment
6. Generate full story
7. Check library

### 3. Verify Database

Check MongoDB Atlas:
- Users collection has entries
- Stories collection has entries

### 4. Verify File Storage

Check Cloudflare R2:
- Files are uploading to `voice-stories/` folder
- Public URLs are accessible

### 5. Monitor Logs

View logs in Vercel dashboard:
- **Functions** → Select function → **Logs**
- Check for errors

---

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
- **Analytics** → **Enable**

Tracks:
- Page views
- Performance metrics
- Error rates

### External API Monitoring

Monitor usage:
- **Gemini**: https://aistudio.google.com/app/apikey
- **ElevenLabs**: https://elevenlabs.io/subscription
- **Stripe**: https://dashboard.stripe.com/

### Database Monitoring

MongoDB Atlas dashboard:
- **Metrics**: Query performance, storage size
- **Alerts**: Set up alerts for issues

### Error Tracking (Optional)

Integrate Sentry for error tracking:
```bash
npm install @sentry/nextjs
```

### Cost Monitoring

Track costs:
- **Vercel**: Free tier or Pro ($20/month)
- **MongoDB Atlas**: Free M0 or paid tiers
- **Cloudflare R2**: $0.015/GB storage
- **Gemini**: Pay-per-token
- **ElevenLabs**: Subscription-based
- **Stripe**: 2.9% + 30¢ per transaction

---

## Scaling Considerations

### Database

**MongoDB Atlas Auto-Scaling**:
- Upgrade to M10+ cluster for auto-scaling
- Enable backups

### Storage

**Cloudflare R2**:
- Unlimited storage (pay-per-GB)
- Automatic CDN distribution

### Compute

**Vercel Pro**:
- Longer function execution (60s vs 10s)
- More concurrent executions
- Team collaboration

### Background Jobs

For long-running tasks:
- Move to queue (AWS SQS, BullMQ)
- Use separate worker servers
- Implement job status polling

---

## Backup & Recovery

### Database Backups

**MongoDB Atlas**:
- Enable continuous backups in M10+ clusters
- Or export manually:
  ```bash
  mongodump --uri="mongodb+srv://..." --out=backup
  ```

### File Backups

**Cloudflare R2**:
- No built-in backup (consider syncing to another bucket)
- Or use lifecycle policies

### Code Backups

**Git**:
- Push to GitHub/GitLab
- Tag releases: `git tag v1.0.0`

---

## Security Best Practices

1. **Environment Variables**: Never commit to Git
2. **API Keys**: Rotate regularly
3. **Database**: Use strong passwords, IP whitelist
4. **HTTPS**: Always use SSL/TLS
5. **Webhooks**: Verify signatures
6. **Rate Limiting**: Implement on API routes
7. **Input Validation**: Sanitize all user inputs
8. **CORS**: Restrict to specific domains

---

## Troubleshooting

### Build Failures

**Error**: `Build failed: Module not found`

**Solution**:
- Check all dependencies in `package.json`
- Clear Vercel cache and redeploy

### Function Timeouts

**Error**: `Task timed out after 10 seconds`

**Solution**:
- Use FFmpeg VPS for audio processing
- Or upgrade to Vercel Pro (60s timeout)

### Database Connection Issues

**Error**: `MongoServerSelectionError`

**Solution**:
- Verify MongoDB URI is correct
- Check network access whitelist
- Ensure database user has permissions

### R2 Upload Failures

**Error**: `Access Denied`

**Solution**:
- Verify R2 credentials
- Check bucket permissions
- Ensure API token is valid

---

**Last Updated**: January 14, 2026
