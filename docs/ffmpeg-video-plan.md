# Cheap Video Generation Research & Plan

## Current Problem
- **Current cost**: ~$0.50-$0.80 per 5-second video using Kie.AI/Kling
- **4-section video story**: ~$2.00-$3.20 just for videos (plus ~$0.08 for images)
- **User goal**: Find the cheapest possible video generation

## Research Summary: Video Generation Cost Tiers

### TIER 0: FREE - FFmpeg Ken Burns Effect ($0.00)
Generate AI images, then animate with pan/zoom effects using FFmpeg or Remotion.

| Approach | Cost | Quality | Notes |
|----------|------|---------|-------|
| FFmpeg zoompan | $0 | Slideshow | Pan/zoom on static images |
| Remotion (React) | $0 | Slideshow | Programmatic video from images |
| kburns-slideshow | $0 | Slideshow | Python script with transitions |

**Pros**: Completely free, runs locally, no API limits
**Cons**: Not "true" AI video - no motion/animation in the scene itself

### TIER 1: BUDGET - Open Source Models ($0.05-$0.15/video)

| Provider | Model | Cost | Notes |
|----------|-------|------|-------|
| **fal.ai** | Wan 2.5 | $0.05/sec ($0.25/5s) | Best value, open-source |
| **Runware** | Seedance 1.0 Lite | $0.14/video | Cheapest on Runware |
| **Replicate** | Stable Video Diffusion | ~$0.18/run | Self-hostable |

**4-section story cost**: $0.56 - $1.00

### TIER 2: MID-RANGE - Quality/Cost Balance ($0.25-$0.45/video)

| Provider | Model | Cost | Notes |
|----------|-------|------|-------|
| **Runware** | PixVerse V4.5 | $0.29/video | Good quality |
| **Runware** | Vidu Q1 | $0.275/video | |
| **Runware** | MiniMax Hailuo 02 | $0.43/video | Higher quality |
| **Replicate** | PixVerse v4 | ~$0.30/video | |

**4-section story cost**: $1.00 - $1.80

### TIER 3: PREMIUM - Current Implementation ($0.50-$0.92/video)

| Provider | Model | Cost | Notes |
|----------|-------|------|-------|
| **Kie.AI** | Kling 2.1 Master | $0.50-$0.80 | Current implementation |
| **Runware** | Kling 2.1 Master | $0.92/video | |
| **fal.ai** | Kling 2.5 Turbo Pro | $0.07/sec ($0.35/5s) | |

**4-section story cost**: $1.40 - $3.20

---

## Cost Comparison (4-section video story)

| Approach | Video Cost | Image Cost | Total | Savings |
|----------|------------|------------|-------|---------|
| Current (Kling via Kie) | $2.00-$3.20 | $0.08 | ~$3.00 | baseline |
| Wan 2.5 (fal.ai) | $1.00 | $0.08 | ~$1.08 | 64% |
| Seedance (Runware) | $0.56 | $0.08 | ~$0.64 | 79% |
| FFmpeg Ken Burns | $0.00 | $0.08 | ~$0.08 | 97% |

---

## Recommended Options

### Option A: Hybrid Approach (Recommended)
- **Images**: Keep Kie.AI Flux Kontext (~$0.01/image)
- **Videos**: Switch to fal.ai Wan 2.5 ($0.05/second)
- **Cost**: ~$1.08 per story (64% savings)
- **Quality**: Good AI-generated motion

### Option B: Ultra-Cheap with AI Video
- **Images**: Keep Kie.AI Flux Kontext
- **Videos**: Runware Seedance 1.0 Lite ($0.14/video)
- **Cost**: ~$0.64 per story (79% savings)
- **Quality**: Acceptable, may vary

### Option C: Free (Ken Burns Effect)
- **Images**: Keep Kie.AI Flux Kontext
- **Videos**: FFmpeg zoompan locally ($0)
- **Cost**: ~$0.08 per story (97% savings)
- **Quality**: Animated slideshow, not true AI video

### Option D: Quality at Lower Cost
- **Images**: Keep Kie.AI
- **Videos**: fal.ai Kling 2.5 Turbo Pro ($0.07/sec = $0.35/5s)
- **Cost**: ~$1.48 per story (50% savings)
- **Quality**: Same Kling quality, cheaper provider

---

## Implementation Plan: FFmpeg Ken Burns Effect

**Chosen Approach**: Free video generation using FFmpeg zoompan effects on AI images
**Cost**: $0.08 per story (images only) - **97% savings**

### Architecture

```
Current Flow:
  AI Images (8) → Kie.AI Video Gen ($2+) → R2 Upload

New Flow:
  AI Images (8) → FFmpeg Ken Burns (FREE) → R2 Upload
```

### Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/kenBurns.ts` | **CREATE** | FFmpeg-based video generation with zoompan effects |
| `src/lib/gemini.ts` | **MODIFY** | Add FFmpeg-specific camera metadata to analysis |
| `src/app/api/story/[id]/generate-video-ffmpeg/route.ts` | **CREATE** | New route for FFmpeg-based video generation |
| `src/app/api/story/[id]/generate-video/route.ts` | **KEEP** | Original Kie.AI implementation (unchanged) |
| `src/lib/kie.ts` | **KEEP** | Still used for images + original video route |

### File Organization

```
src/lib/
├── kie.ts              # Keep - Kie.AI (images + premium videos)
├── kenBurns.ts         # NEW - FFmpeg Ken Burns video generation
├── gemini.ts           # MODIFY - Add FFmpeg camera metadata

src/app/api/story/[id]/
├── generate-video/route.ts        # KEEP - Premium Kie.AI videos ($3/story)
├── generate-video-ffmpeg/route.ts # NEW - Free FFmpeg videos ($0.08/story)
```

### Implementation Steps

#### Step 1: Update Gemini Analysis for FFmpeg Metadata

Modify `analyzeStoryForVideo()` in `src/lib/gemini.ts` to return FFmpeg-compatible camera instructions:

```typescript
interface FFmpegCameraMovement {
  effect: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down';
  startZoom: number;    // 1.0 = normal, 1.5 = 50% zoomed in
  endZoom: number;
  startX: number;       // 0-1 normalized position (0.5 = center)
  startY: number;
  endX: number;
  endY: number;
  easing: 'linear' | 'ease-in' | 'ease-out';
}

// Each section will have:
sections: Array<{
  // ... existing fields ...
  cameraMovement: string;           // Keep for Kie.AI
  ffmpegCamera: FFmpegCameraMovement; // NEW for FFmpeg
}>
```

**Example AI Output**:
```json
{
  "ffmpegCamera": {
    "effect": "zoom-in",
    "startZoom": 1.0,
    "endZoom": 1.3,
    "startX": 0.5,
    "startY": 0.5,
    "endX": 0.4,
    "endY": 0.3,
    "easing": "ease-out"
  }
}
```

#### Step 2: Create `src/lib/kenBurns.ts`

```typescript
// Ken Burns video generation using FFmpeg
// - Download image
// - Apply zoompan effect based on FFmpegCameraMovement
// - Output MP4 video

export async function generateKenBurnsVideo(options: {
  imageUrl: string;           // Single image (we'll use startImage)
  duration: number;           // seconds
  camera: FFmpegCameraMovement;
  outputPath: string;
}): Promise<string>
```

#### Step 3: FFmpeg Command Examples

**Zoom In Effect (5 seconds)**:
```bash
ffmpeg -loop 1 -i image.jpg -vf "zoompan=z='zoom+0.001':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1280x720:fps=30" -t 5 -c:v libx264 -pix_fmt yuv420p out.mp4
```

**Pan Left Effect**:
```bash
ffmpeg -loop 1 -i image.jpg -vf "zoompan=z=1.1:x='if(gte(on,1),x+1,0)':y='ih/2-(ih/zoom/2)':d=150:s=1280x720:fps=30" -t 5 out.mp4
```

#### Step 3: Transition Types per Section

| Section | Effect | Description |
|---------|--------|-------------|
| 1 | zoom-in | Slow zoom into the start scene |
| 2 | pan-right | Pan across the scene |
| 3 | zoom-out | Pull back to reveal more |
| 4 | zoom-in | Final zoom to cozy ending |

#### Step 4: Create New FFmpeg Route

Create `src/app/api/story/[id]/generate-video-ffmpeg/route.ts`:

```typescript
// Similar to generate-video/route.ts but uses FFmpeg instead of Kie.AI

// Step 1: Analyze story (same as before, but request ffmpegCamera metadata)
const analysis = await analyzeStoryForVideo(story.storyText, { includeFFmpegMetadata: true });

// Step 2: Generate images with Kie.AI (same as before - keep quality images)
const startImageUrl = await generateImage({ prompt, ... });

// Step 3: Generate videos with FFmpeg (NEW - free)
const videoUrl = await generateKenBurnsVideo({
  imageUrl: startImageUrl,
  duration: 5,
  camera: section.ffmpegCamera,
  outputPath: `/tmp/video-${storyId}-${section.sectionNumber}.mp4`,
});

// Step 4: Upload to R2 (same as before)
const permanentUrl = await uploadVideoFromUrl(videoUrl, storyId, ...);
```

#### Step 5: UI Support for Both Modes

Update story page to show both options:
- "Create Video Story (Premium)" → calls `/generate-video` ($3)
- "Create Video Story (Basic)" → calls `/generate-video-ffmpeg` ($0.08)

### Technical Considerations

1. **FFmpeg Installation**:
   - Local dev: Already installed ✓
   - Production: Figure out later (WASM, external service, or client-side)

2. **Quality Settings**:
   - Resolution: 1280x720 (HD)
   - FPS: 30
   - Codec: H.264 (libx264)
   - Duration: 5 seconds per section

---

## Sources
- [Runware Pricing](https://runware.ai/blog/lowest-cost-ai-video-generation-now-on-runware)
- [fal.ai Pricing](https://fal.ai/pricing)
- [Replicate Video Models](https://replicate.com/collections/text-to-video)
- [FFmpeg Ken Burns](https://www.bannerbear.com/blog/how-to-do-a-ken-burns-style-effect-with-ffmpeg/)
- [Remotion Ken Burns](https://www.reactvideoeditor.com/remotion-templates/ken-burns)
- [Open Source Video Models](https://www.pixazo.ai/blog/best-open-source-ai-video-generation-models)
