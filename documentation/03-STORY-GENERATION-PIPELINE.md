# Story Generation Pipeline

Detailed breakdown of how stories are composed, narrated, scored with music, and mixed into final audio files.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Story Composition (Google Gemini)](#story-composition-google-gemini)
3. [Music Generation & Selection](#music-generation--selection)
4. [Voice Narration (ElevenLabs)](#voice-narration-elevenlabs)
5. [Audio Mixing (Pure JavaScript)](#audio-mixing-pure-javascript)
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
│ 4. AUDIO MIXING          │  Pure JavaScript
│    Combine narration +   │  mpg123-decoder + lamejs
│    music with fades      │  No FFmpeg required!
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

## Audio Mixing (Pure JavaScript)

### Overview
**File**: `src/lib/simpleAudioMixer.ts`
**Purpose**: Combine narration + background music using pure JavaScript
**Dependencies**: `mpg123-decoder` (WASM), `@breezystack/lamejs`

### Why Pure JavaScript?

Previously, audio mixing required FFmpeg which had significant drawbacks:
- Required FFmpeg installed locally for development
- Needed a separate VPS running FFmpeg for production (Vercel can't run FFmpeg)
- Keeping both environments in sync was difficult and error-prone

The new approach uses **pure JavaScript** libraries that work everywhere:
- ✅ Works on Vercel serverless (no native dependencies)
- ✅ Works in local development (no FFmpeg installation needed)
- ✅ Single codebase for all environments
- ✅ Faster processing (no FFmpeg process spawning)

### Processing Pipeline

```
1. Decode narration MP3 → PCM (mpg123-decoder)
2. Fetch & decode music MP3 → PCM
3. Resample music if sample rates differ
4. Loop music to match narration length
5. Apply fade in/out to music
6. Mix PCM streams (narration 100%, music 20%)
7. Soft clip to prevent distortion
8. Encode final PCM → MP3 (lamejs)
```

### Mixing Parameters

**Default Options**:
```typescript
{
  musicVolume: 0.20,       // Music at 20% of narration
  fadeInDuration: 2,       // 2-second fade in
  fadeOutDuration: 3       // 3-second fade out
}
```

**Note**: Unlike the previous FFmpeg implementation, there is no sidechain compression (ducking). The music plays at a constant volume, which works well for bedtime stories as the lower volume level (20%) keeps music subtle throughout.

### Main Function

**Function**: `mixAudioSimple()`
**File**: `src/lib/simpleAudioMixer.ts`

```typescript
export async function mixAudioSimple(options: SimpleMixOptions): Promise<SimpleMixResult> {
  const {
    narrationBuffer,
    musicUrl,
    musicVolume = 0.20,
    fadeInDuration = 2,
    fadeOutDuration = 3,
  } = options;

  // 1. Decode narration MP3 to PCM
  const narrationPcm = await decodeMp3(narrationBuffer);

  // 2. Fetch and decode music
  const musicBuffer = await fetchMusic(musicUrl);
  const musicPcm = await decodeMp3(musicBuffer);

  // 3. Resample music if needed
  // 4. Loop music to match narration length
  // 5. Apply fade in/out to music
  // 6. Mix at specified volumes
  // 7. Encode to MP3

  return { buffer: mp3Buffer, duration };
}
```

### Audio Processing Details

#### MP3 Decoding (mpg123-decoder)
- WASM-based decoder, works in Node.js
- Outputs Float32Array PCM samples
- Supports mono and stereo

#### Fade Effects
- **Fade In**: Linear ramp from 0 to full volume over 2 seconds
- **Fade Out**: Linear ramp from full volume to 0 over 3 seconds (starts 3s before end)

#### Mixing
- Narration: 100% volume (1.0)
- Music: 20% volume (0.20)
- Soft clipping to prevent distortion when signals combine

#### MP3 Encoding (lamejs)
- Pure JavaScript LAME encoder
- Output: 192 kbps stereo MP3
- Block size: 1152 samples per encode call

### Output Specifications
- **Format**: MP3
- **Bitrate**: 192 kbps
- **Sample Rate**: Matches narration (typically 44100 Hz)
- **Channels**: Stereo

### Comparison: Old vs New

| Feature | Old (FFmpeg) | New (Pure JS) |
|---------|--------------|---------------|
| Sidechain Compression | ✅ Yes | ❌ No |
| Dreamy Voice Effects | ✅ Echo/Lowpass | ❌ No |
| LUFS Normalization | ✅ Yes | ❌ No |
| Serverless Compatible | ❌ No | ✅ Yes |
| External Dependencies | FFmpeg binary | None |
| Processing Speed | Slower | Faster |
| Music Volume | 25% + ducking | 20% constant |

The simplified approach trades some audio polish for operational simplicity and reliability.

---

## Processing Times

### Preview Story (30 seconds)

| Step | Time | Notes |
|------|------|-------|
| Gemini Story Gen | 2-4s | ~100 words |
| Music Selection | 1-3s | Library lookup or Mubert |
| ElevenLabs TTS | 3-5s | ~100 words input |
| JS Audio Mix | 3-8s | 60-second audio (pure JS) |
| Blob Upload | 1-2s | ~2-3 MB file |
| **Total** | **10-22s** | User waits ~15-25s |

### Full Story (10 minutes)

| Step | Time | Notes |
|------|------|-------|
| Gemini Story Gen | 5-10s | 1400-1600 words |
| Music Selection | 1-3s | Library lookup or Mubert |
| ElevenLabs TTS | 30-60s | 1500 words input |
| JS Audio Mix | 15-30s | 600-second audio (pure JS) |
| Blob Upload | 5-10s | ~15-20 MB file |
| **Total** | **55-113s** | User waits 1-2 minutes |

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

**Last Updated**: February 2, 2026
