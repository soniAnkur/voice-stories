# Story Generation Pipeline

Detailed breakdown of how stories are composed, narrated, scored with music, and mixed into final audio files.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Story Composition (Google Gemini)](#story-composition-google-gemini)
3. [Music Generation & Selection](#music-generation--selection)
4. [Voice Narration (ElevenLabs)](#voice-narration-elevenlabs)
5. [Audio Mixing (FFmpeg)](#audio-mixing-ffmpeg)
6. [Processing Times](#processing-times)

---

## Pipeline Overview

```
Input: Child Details + Theme
    ↓
┌──────────────────────────┐
│ 1. STORY COMPOSITION     │  Google Gemini 2.0 Flash
│    Generate narrative    │  Temperature: 0.85
│    with audio tags       │  Output: 100-1600 words
└──────────────────────────┘
    ↓
┌──────────────────────────┐
│ 2. MUSIC SELECTION       │  Mubert AI (optional)
│    AI-generated or       │  or Curated Library
│    curated track         │  Output: MP3 URL
└──────────────────────────┘
    ↓
┌──────────────────────────┐
│ 3. VOICE NARRATION       │  ElevenLabs API v3
│    Text-to-speech with   │  Cloned parent voice
│    parent's voice        │  Speed: 0.7x (slowest)
└──────────────────────────┘
    ↓
┌──────────────────────────┐
│ 4. AUDIO MIXING          │  FFmpeg
│    Combine narration +   │  Sidechain compression
│    music with effects    │  Dreamy filters
└──────────────────────────┘
    ↓
Output: 30-second preview or 10-minute full story MP3
```

---

## Story Composition (Google Gemini)

### Overview
**File**: `src/lib/gemini.ts`
**Model**: `gemini-2.0-flash`
**Purpose**: Generate age-appropriate bedtime story narratives

### Configuration

```typescript
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const generationConfig = {
  temperature: 0.85,        // High creativity
  maxOutputTokens: 4000     // Max response length
};
```

### System Prompt Structure

**File**: `src/lib/gemini.ts` (lines 52-131)

The system prompt enforces strict story structure:

#### Mandatory 6-Part Narrative Arc

```
HOOK (5%)           → Attention-grabbing opening
SETUP (15%)         → Introduce world and quest
ADVENTURE (50%)     → Main journey with 3-4 challenges
CLIMAX (15%)        → Exciting peak moment
RESOLUTION (10%)    → Quest completion
WIND-DOWN (5%)      → Peaceful transition to sleep
```

#### Audio Tags for Expressiveness

Required tags for ElevenLabs TTS:
- `[softly]` - Gentle, calming tone
- `[whispers]` - Quiet, intimate moments
- `[warmly]` - Affectionate, comforting
- `[excited]` - Brief moments of adventure
- `[pause]` - Natural breathing breaks
- `[long pause]` - Scene transitions
- `[peacefully]` - Wind-down sections
- `[sighs]`, `[yawns]` - Sleepy atmosphere

#### Age-Appropriate Vocabulary

| Age Range | Vocabulary | Sentence Structure |
|-----------|------------|-------------------|
| 2-3 years | Basic words (cat, dog, moon) | 3-5 words per sentence |
| 4-5 years | Simple words (adventure, forest) | 5-8 words per sentence |
| 6-7 years | Richer vocabulary (magical, journey) | Longer, varied sentences |
| 8-10 years | Full vocabulary (mysterious, courage) | Complex narratives |

### Preview Story Generation

**Function**: `generatePreviewStory()`
**File**: `src/lib/gemini.ts` (lines 152-186)

**User Prompt**:
```
Create a compelling 30-second story PREVIEW (approximately 100 words)
for a [childAge]-year-old child named [childName].

Child's interests: [interests]
Story theme: [theme]

This is a TEASER that must:
1. Start with an attention-grabbing HOOK
2. Introduce [childName] discovering something exciting
3. Hint at an adventure about to begin
4. End on a CLIFFHANGER that makes them want the full story

Use [softly], [excited], [whispers], [pause] tags naturally.
Include a brief wind-down hint: "But that's a story for another time..."
```

**Example Response**:
```json
{
  "title": "Emma and the Starlight Dragon",
  "story": "[softly] Once upon a time, little Emma was gazing at the stars from her bedroom window when [excited] she noticed something magical! A tiny dragon made of starlight was flying between the constellations! [whispers] \"Hello, Emma,\" the dragon sparkled. \"I need your help to find the lost constellation.\" [pause] Emma's heart filled with wonder. [softly] But that's a story for another time...",
  "backgroundMusicPrompt": "gentle twinkling magical calm"
}
```

**Word Count**: ~100 words
**Duration**: ~30 seconds when narrated at 0.7x speed

### Full Story Generation

**Function**: `generateFullStory()`
**File**: `src/lib/gemini.ts` (lines 210-288)

**User Prompt**:
```
Create an engaging 10-minute bedtime adventure story
for a [childAge]-year-old child named [childName].

WORD COUNT: You MUST write between 1400-1600 words. This is NON-NEGOTIABLE.

Child's interests: [interests]
Story theme: [theme]

MANDATORY STRUCTURE with word counts:
- HOOK (5%): 70-80 words - Magical opening
- SETUP (15%): 210-240 words - World introduction
- ADVENTURE (50%): 700-800 words - Main journey with 3-4 challenges
- CLIMAX (15%): 210-240 words - Peak excitement
- RESOLUTION (10%): 140-160 words - Quest completion
- WIND-DOWN (5%): 70-80 words - Peaceful sleep transition

Requirements:
- Feature [childName] as the hero
- Incorporate [interests] naturally
- Use audio tags throughout: [softly], [whispers], [pause], etc.
- Build gentle excitement, never scary
- End with peaceful, sleepy imagery
- CRITICAL: Wind-down MUST be supremely calming for sleep
```

**Example Response**:
```json
{
  "title": "Emma's Journey Through the Enchanted Forest",
  "story": "[softly] In a cozy little village at the edge of an enchanted forest, lived a brave girl named Emma...\n\n[The full 1500-word story with all tags and structure]\n\n...[peacefully] And as the forest lights dimmed like tiny fireflies going to sleep, Emma closed her eyes, knowing tomorrow would bring new adventures. [whispers] But for now, it was time to dream. [long pause] Goodnight, Emma. Goodnight, magical forest. [very softly] Sweet dreams...",
  "backgroundMusicPrompt": "warm forest peaceful lullaby"
}
```

**Word Count**: 1400-1600 words
**Duration**: ~10 minutes when narrated at 0.7x speed

### Fallback: Mock Stories

**When Used**: Gemini API quota exceeded or error

**Functions**:
- `getMockPreviewStory()` (lines 16-33)
- `getMockFullStory()` (lines 35-50)

Returns pre-written story JSON to ensure user always gets content.

---

## Music Generation & Selection

### Overview
**File**: `src/lib/music.ts`
**Strategy**: Two-tier approach (AI-generated + curated library)

### Tier 1: Mubert AI Music Generation

**When Available**: `MUBERT_API_KEY` is set

**Function**: `generateMusicWithMubert()`
**File**: `src/lib/music.ts` (lines 205-282)

**Flow**:

1. **Get PAT Token**:
   ```typescript
   POST https://api-b2b.mubert.com/v2/GetServiceAccess
   Body: {
     method: "GetServiceAccess",
     params: {
       email: "api@voicebedtimetales.com",
       license: MUBERT_API_KEY,
       token: MUBERT_API_KEY,
       mode: "loop"
     }
   }
   ```

2. **Generate Track**:
   ```typescript
   POST https://api-b2b.mubert.com/v2/RecordTrackTTM
   Body: {
     method: "RecordTrackTTM",
     params: {
       pat: patToken,
       prompt: "[backgroundMusicPrompt] calm bedtime lullaby peaceful sleep",
       duration: 600,  // 10 minutes
       format: "mp3",
       intensity: "low",
       mode: "loop"
     }
   }
   ```

**Output**: MP3 URL from Mubert

### Tier 2: Curated Music Library (Fallback)

**Location**: `/public/music/`
**Function**: `selectMusicTrack()`
**File**: `src/lib/music.ts` (lines 118-185)

#### Available Tracks (10 total, CC0 Licensed)

| Filename | Duration | Moods |
|----------|----------|-------|
| `lullaby-piano.mp3` | 10:25 | calm, peaceful, sleepy, piano |
| `calming-sleep.mp3` | 10:00 | calm, peaceful, sleepy, dreamy |
| `deep-sleep.mp3` | 9:39 | sleepy, peaceful, calm, meditation |
| `kids-lullaby.mp3` | 10:11 | calm, warm, sleepy, magical |
| `meditation-lullaby.mp3` | 9:38 | peaceful, meditation, dreamy, fairy |
| `cute-lullaby.mp3` | 1:49 | magical, fairy, warm, playful |
| `ocean-waves.mp3` | 19:48 | ocean, calm, nature, peaceful |
| `forest-birds.mp3` | 9:42 | nature, animals, forest, calm |
| `gentle-rain.mp3` | 36:00 | nature, calm, peaceful, sleepy |
| `piano-sleep.mp3` | 10:25 | piano, sleepy, calm, peaceful |

#### Selection Algorithm

**Scoring System**:

1. **Theme-Based Mood Mapping** (lines 103-113):
   ```typescript
   const THEME_MOOD_MAP = {
     adventure: ["warm", "magical", "peaceful", "piano"],
     animals: ["nature", "animals", "forest", "calm"],
     space: ["dreamy", "magical", "meditation", "peaceful"],
     ocean: ["ocean", "calm", "nature", "peaceful"],
     fairy: ["fairy", "magical", "dreamy", "meditation"],
     dinosaurs: ["nature", "warm", "forest", "animals"],
     forest: ["forest", "nature", "animals", "calm"],
     rain: ["nature", "calm", "peaceful", "sleepy"]
   };
   ```

2. **Mood Matching**: +2 points per matching mood

3. **Keyword Matching in Music Prompt**:
   - Piano/Soft keywords + track has "piano" = +3
   - Ocean/Waves keywords + track has "ocean" = +3
   - Forest/Bird/Nature keywords = +3
   - "Rain" keyword + `gentle-rain.mp3` = +4
   - Magical/Fairy/Dream keywords = +2
   - Sleep/Calm/Peaceful keywords = +2
   - "Lullaby" or "Gentle" in prompt = +1

4. **Select Highest Score**: Track with most points wins

**Example**:
```typescript
Theme: "ocean"
Music Prompt: "gentle ocean waves peaceful calm"

Scoring:
  ocean-waves.mp3:
    - Theme mood match (ocean, calm, nature, peaceful): +8
    - Keyword "ocean": +3
    - Keyword "waves": +3
    - Keywords "peaceful", "calm": +4
    Total: 18 points → SELECTED

  lullaby-piano.mp3:
    - Theme mood match (peaceful, calm): +4
    - Keywords "peaceful", "calm": +4
    Total: 8 points
```

### Music Retrieval Function

**Function**: `getBackgroundMusic()`
**File**: `src/lib/music.ts` (lines 18-46)

```typescript
export async function getBackgroundMusic(
  theme: string,
  backgroundMusicPrompt?: string,
  duration: number = 300
): Promise<{ url: string; source: "mubert" | "library" }> {

  // Try Mubert first if API key available
  if (MUBERT_API_KEY && backgroundMusicPrompt) {
    const mubertUrl = await generateMusicWithMubert({
      prompt: backgroundMusicPrompt,
      duration,
      intensity: "low",
    });

    if (mubertUrl) {
      return { url: mubertUrl, source: "mubert" };
    }
  }

  // Fallback to curated library
  const track = selectMusicTrack(theme, backgroundMusicPrompt);
  return { url: track.url, source: "library" };
}
```

---

## Voice Narration (ElevenLabs)

### Overview
**File**: `src/lib/elevenlabs.ts`
**API**: ElevenLabs v3
**Purpose**: Convert story text to speech using cloned parent voice

### Voice Cloning

**Function**: `cloneVoice()`
**File**: `src/lib/elevenlabs.ts` (lines 28-57)

**Process**:
```typescript
export async function cloneVoice(
  audioBuffer: Buffer,
  name: string
): Promise<string> {
  const formData = new FormData();
  formData.append("name", name);

  const arrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  );
  formData.append(
    "files",
    new Blob([arrayBuffer], { type: "audio/mpeg" }),
    "sample.mp3"
  );
  formData.append("description", "Voice Bedtime Tales - Parent Voice");

  const response = await fetch(`${BASE_URL}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
    body: formData,
  });

  const data = await response.json();
  return data.voice_id;  // Store in User.elevenlabsVoiceId
}
```

**Requirements**:
- Minimum 30 seconds of audio
- Clear speech, minimal background noise
- Natural speaking voice (storytelling tone)

### Text-to-Speech

**Function**: `textToSpeech()`
**File**: `src/lib/elevenlabs.ts` (lines 72-97)

**Bedtime Voice Settings**:
```typescript
const BEDTIME_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,           // More expressive for storytelling
  similarity_boost: 0.75,   // Closer to original voice
  style: 0.4,               // Natural style for bedtime
  use_speaker_boost: true,  // Enhanced clarity
  speed: 0.7                // SLOWEST POSSIBLE (sleep-inducing)
};
```

**Why Speed 0.7x?**
- Slows down narration for calming effect
- Gives child time to visualize story
- Induces sleepiness
- Extends 1500-word story to ~10 minutes

**Implementation**:
```typescript
export async function textToSpeech(
  text: string,
  voiceId: string,
  settings: VoiceSettings = BEDTIME_VOICE_SETTINGS
): Promise<Buffer> {
  const response = await fetch(
    `${BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_v3",  // v3 supports audio tags
        voice_settings: settings,
      }),
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);  // MP3 audio buffer
}
```

**Audio Tag Processing**:
- `[softly]` → Lower volume, warmer tone
- `[whispers]` → Very quiet, intimate
- `[excited]` → Higher pitch, faster pace
- `[pause]` → 0.5-second silence
- `[long pause]` → 1-2 second silence

---

## Audio Mixing (FFmpeg)

### Overview
**File**: `src/lib/audioMixer.ts`
**Purpose**: Combine narration + music with professional audio effects

### Three-Tier Processing Strategy

#### Tier 1: Local FFmpeg (Development)
**Function**: `mixNarrationWithMusicLocal()`
**File**: `src/lib/audioMixer.ts` (lines 148-214)

Uses native FFmpeg via Node.js `child_process.spawn()`

#### Tier 2: Remote FFmpeg API (Production/Vercel)
**Function**: `mixNarrationWithMusicRemote()`
**File**: `src/lib/audioMixer.ts` (lines 66-143)

**API Endpoint**: `POST [FFMPEG_API_URL]/api/mix`

**Request Payload**:
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

**Remote Server**: VPS with FFmpeg installed (`/ffmpeg-api/index.js`)

#### Tier 3: Fallback
Returns narration-only MP3 if FFmpeg unavailable

### Mixing Parameters

**Default Options**:
```typescript
{
  musicVolume: 0.25,          // Music at 25% of narration
  ducking: true,              // Enable sidechain compression
  duckingAmount: 0.5,         // Reduce music to 50% when voice plays
  fadeInDuration: 2,          // 2-second fade in
  fadeOutDuration: 3,         // 3-second fade out
  applyDreamyEffects: true    // Add echo/lowpass to voice
}
```

**Preview vs Full**:
| Type | Fade In | Fade Out | Duration |
|------|---------|----------|----------|
| Preview | 1s | 2s | ~60s |
| Full | 2s | 3s | ~600s |

### FFmpeg Filter Complex

**Function**: `buildMixFilter()`
**File**: `src/lib/audioMixer.ts` (lines 264-326)

**Complete Filter Chain**:

```bash
# Input: [0:a] = narration, [1:a] = music

# 1. VOICE PROCESSING (Dreamy Effects)
[0:a]lowpass=f=8000,
     aecho=0.8:0.5:100|200|300:0.5|0.35|0.2,
     aecho=0.8:0.4:500|700:0.3|0.2,
     aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]

# 2. MUSIC PROCESSING (Loop & Fade)
[1:a]aloop=loop=-1:size=2e+09,
     atrim=0:600,
     volume=0.25,
     afade=t=in:st=0:d=2,
     afade=t=out:st=597:d=3[musicfaded]

# 3. SIDECHAIN COMPRESSION (Ducking)
[musicfaded][voice]sidechaincompress=threshold=0.02:ratio=4:attack=50:release=400:level_sc=0.5[musicducked]

# 4. MIX & NORMALIZE
[voice][musicducked]amix=inputs=2:duration=first:dropout_transition=2,
                    loudnorm=I=-16:TP=-1.5:LRA=11[final]
```

**Effect Breakdown**:

1. **Voice Processing**:
   - `lowpass=f=8000`: Cut harsh high frequencies, warmer sound
   - `aecho`: Double echo effect for dreamy atmosphere
     - First echo: 100-300ms delays, 0.5-0.2 decay
     - Second echo: 500-700ms delays, 0.3-0.2 decay
   - `aformat`: Ensure consistent format (44.1kHz stereo)

2. **Music Processing**:
   - `aloop`: Loop indefinitely
   - `atrim`: Cut to exact duration (match narration)
   - `volume`: Set to 25% (0.25)
   - `afade in`: 2-second fade from silence
   - `afade out`: 3-second fade to silence (3 seconds before end)

3. **Sidechain Compression**:
   - `threshold=0.02`: Very sensitive detection (2% of max)
   - `ratio=4`: 4:1 compression ratio
   - `attack=50`: Fast response (50ms)
   - `release=400`: Smooth return (400ms)
   - `level_sc=0.5`: Music drops to 50% when voice detected

4. **Final Mix**:
   - `amix`: Combine voice + ducked music
   - `duration=first`: Use narration duration
   - `dropout_transition=2`: Smooth 2-second transition
   - `loudnorm`: Loudness normalization
     - `I=-16`: Target integrated loudness (LUFS)
     - `TP=-1.5`: True peak limit (prevent clipping)
     - `LRA=11`: Loudness range

**Output Specifications**:
```bash
ffmpeg ... -c:a libmp3lame -b:a 192k -ar 44100 -ac 2 output.mp3
```
- **Codec**: MP3 (libmp3lame)
- **Bitrate**: 192 kbps
- **Sample Rate**: 44100 Hz
- **Channels**: Stereo (2)

### Remote FFmpeg API Server

**File**: `/ffmpeg-api/index.js`

**Endpoints**:
- `GET /api/health` - Health check
- `POST /api/mix` - Audio mixing (requires Bearer token)

**Process** (lines 11-107):
```javascript
1. Validate inputs (URLs, parameters)
2. Create temporary directory
3. Download narration and music in parallel
4. Get audio duration (ffprobe)
5. Build FFmpeg filter complex
6. Run FFmpeg mixing
7. Upload result to Cloudflare R2
8. Return public URL + processing time
9. Cleanup temporary files
```

**Example Response**:
```json
{
  "success": true,
  "mixedUrl": "https://r2.dev/mixed/job_abc123.mp3",
  "processingTime": "12.5s"
}
```

---

## Processing Times

### Preview Story (30 seconds)

| Step | Time | Notes |
|------|------|-------|
| Gemini Story Gen | 2-4s | ~100 words |
| Music Selection | 1-3s | Library lookup or Mubert |
| ElevenLabs TTS | 3-5s | ~100 words input |
| FFmpeg Mix | 5-10s | 60-second audio |
| R2 Upload | 1-2s | ~2-3 MB file |
| **Total** | **12-24s** | User waits ~15-30s |

### Full Story (10 minutes)

| Step | Time | Notes |
|------|------|-------|
| Gemini Story Gen | 5-10s | 1400-1600 words |
| Music Selection | 1-3s | Library lookup or Mubert |
| ElevenLabs TTS | 30-60s | 1500 words input |
| FFmpeg Mix | 20-45s | 600-second audio |
| R2 Upload | 5-10s | ~15-20 MB file |
| **Total** | **60-128s** | User waits 1-2 minutes |

### Optimization Opportunities

1. **Parallel Processing**:
   ```typescript
   // Run simultaneously
   const [storyData, musicUrl] = await Promise.all([
     generateFullStory(...),
     getBackgroundMusic(...)
   ]);
   ```
   Saves: 1-3 seconds

2. **Background Jobs**:
   - Move full story generation to queue
   - Send email/notification when ready
   - No user waiting

3. **Caching**:
   - Cache music tracks in memory
   - Reuse voice IDs (no re-cloning)

---

**Last Updated**: January 14, 2026
