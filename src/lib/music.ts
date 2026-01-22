/**
 * Music selection and generation for story backgrounds
 *
 * Strategy: Map story themes/moods to curated royalty-free tracks
 * Alternative: Integrate with Mubert API for AI-generated music
 */

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  duration: number; // seconds
  mood: string[];
  tempo: "slow" | "medium";
}

// Curated royalty-free lullaby/ambient tracks from Archive.org & Orange Free Sounds
// All tracks are CC0 licensed (public domain) - free for commercial use
const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "lullaby-piano",
    name: "Bedtime Piano Lullaby",
    url: "/music/lullaby-piano.mp3",
    duration: 625, // ~10:25
    mood: ["calm", "peaceful", "sleepy", "piano"],
    tempo: "slow",
  },
  {
    id: "calming-sleep",
    name: "Calming Lullaby for Sleeping",
    url: "/music/calming-sleep.mp3",
    duration: 600, // ~10:00
    mood: ["calm", "peaceful", "sleepy", "dreamy"],
    tempo: "slow",
  },
  {
    id: "deep-sleep",
    name: "Music For Deep Sleep",
    url: "/music/deep-sleep.mp3",
    duration: 579, // ~9:39
    mood: ["sleepy", "peaceful", "calm", "meditation"],
    tempo: "slow",
  },
  {
    id: "kids-lullaby",
    name: "Relaxing Lullabies for Kids",
    url: "/music/kids-lullaby.mp3",
    duration: 611, // ~10:11
    mood: ["calm", "warm", "sleepy", "magical"],
    tempo: "slow",
  },
  {
    id: "meditation-lullaby",
    name: "Lullaby Song for Meditation",
    url: "/music/meditation-lullaby.mp3",
    duration: 578, // ~9:38
    mood: ["peaceful", "meditation", "dreamy", "fairy"],
    tempo: "slow",
  },
  {
    id: "cute-lullaby",
    name: "Cute Lullaby",
    url: "/music/cute-lullaby.mp3",
    duration: 109, // ~1:49
    mood: ["magical", "fairy", "warm", "playful"],
    tempo: "medium",
  },
  {
    id: "ocean-waves",
    name: "Gentle Ocean Waves",
    url: "/music/ocean-waves.mp3",
    duration: 1188, // ~19:48
    mood: ["ocean", "calm", "nature", "peaceful"],
    tempo: "slow",
  },
  {
    id: "forest-birds",
    name: "Forest Birdsong",
    url: "/music/forest-birds.mp3",
    duration: 582, // ~9:42
    mood: ["nature", "animals", "forest", "calm"],
    tempo: "slow",
  },
  {
    id: "gentle-rain",
    name: "Light Gentle Rain",
    url: "/music/gentle-rain.mp3",
    duration: 2160, // ~36:00
    mood: ["nature", "calm", "peaceful", "sleepy"],
    tempo: "slow",
  },
  {
    id: "piano-sleep",
    name: "Piano Lullaby Music to Go to Sleep",
    url: "/music/piano-sleep.mp3",
    duration: 625, // ~10:25
    mood: ["piano", "sleepy", "calm", "peaceful"],
    tempo: "slow",
  },
];

// Theme to mood mapping - matches story themes to music moods
const THEME_MOOD_MAP: Record<string, string[]> = {
  adventure: ["warm", "magical", "peaceful", "piano"],
  animals: ["nature", "animals", "forest", "calm"],
  space: ["dreamy", "magical", "meditation", "peaceful"],
  ocean: ["ocean", "calm", "nature", "peaceful"],
  fairy: ["fairy", "magical", "dreamy", "meditation"],
  dinosaurs: ["nature", "warm", "forest", "animals"],
  forest: ["forest", "nature", "animals", "calm"],
  rain: ["nature", "calm", "peaceful", "sleepy"],
  default: ["calm", "peaceful", "sleepy", "piano"],
};

/**
 * Select best matching music track based on story theme and background music prompt
 */
export function selectMusicTrack(
  theme: string,
  backgroundMusicPrompt?: string
): MusicTrack {
  const moods = THEME_MOOD_MAP[theme] || THEME_MOOD_MAP.default;

  // Score each track based on mood match
  let bestTrack = MUSIC_LIBRARY[0];
  let bestScore = 0;

  for (const track of MUSIC_LIBRARY) {
    let score = 0;

    // Check mood overlap
    for (const mood of moods) {
      if (track.mood.includes(mood)) {
        score += 2;
      }
    }

    // Check if background prompt contains track keywords
    if (backgroundMusicPrompt) {
      const prompt = backgroundMusicPrompt.toLowerCase();

      // Piano keywords
      if ((prompt.includes("piano") || prompt.includes("soft")) && track.mood.includes("piano")) {
        score += 3;
      }

      // Ocean/water keywords
      if ((prompt.includes("ocean") || prompt.includes("waves") || prompt.includes("sea")) && track.mood.includes("ocean")) {
        score += 3;
      }

      // Nature/forest keywords
      if ((prompt.includes("forest") || prompt.includes("bird") || prompt.includes("nature")) && (track.mood.includes("nature") || track.mood.includes("forest"))) {
        score += 3;
      }

      // Rain keywords
      if (prompt.includes("rain") && track.id === "gentle-rain") {
        score += 4;
      }

      // Magical/fairy keywords
      if ((prompt.includes("magical") || prompt.includes("fairy") || prompt.includes("dream")) && (track.mood.includes("magical") || track.mood.includes("fairy") || track.mood.includes("dreamy"))) {
        score += 2;
      }

      // Sleep/calm keywords
      if ((prompt.includes("sleep") || prompt.includes("calm") || prompt.includes("peaceful")) && track.mood.includes("sleepy")) {
        score += 2;
      }

      // Lullaby bonus for all tracks
      if (prompt.includes("lullaby") || prompt.includes("gentle")) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestTrack;
}

/**
 * Get music track by ID
 */
export function getMusicTrackById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find((track) => track.id === id);
}

/**
 * Get all available music tracks
 */
export function getAllMusicTracks(): MusicTrack[] {
  return MUSIC_LIBRARY;
}

// ============================================
// MUBERT API INTEGRATION (Optional - for AI-generated music)
// ============================================

const MUBERT_API_KEY = process.env.MUBERT_API_KEY;
const MUBERT_BASE_URL = "https://api-b2b.mubert.com/v2";

interface MubertGenerateParams {
  prompt: string;
  duration: number; // seconds
  intensity?: "low" | "medium" | "high";
}

/**
 * Generate custom background music using Mubert AI
 * Requires MUBERT_API_KEY environment variable
 */
export async function generateMusicWithMubert(
  params: MubertGenerateParams
): Promise<string | null> {
  if (!MUBERT_API_KEY) {
    console.warn("MUBERT_API_KEY not set, falling back to curated tracks");
    return null;
  }

  try {
    // Get Mubert PAT token
    const patResponse = await fetch(`${MUBERT_BASE_URL}/GetServiceAccess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "GetServiceAccess",
        params: {
          email: "api@voicebedtimetales.com",
          license: MUBERT_API_KEY,
          token: MUBERT_API_KEY,
          mode: "loop",
        },
      }),
    });

    const patData = await patResponse.json();
    const pat = patData?.data?.pat;

    if (!pat) {
      console.error("Failed to get Mubert PAT token");
      return null;
    }

    // Generate music
    const generateResponse = await fetch(`${MUBERT_BASE_URL}/RecordTrackTTM`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "RecordTrackTTM",
        params: {
          pat,
          prompt: `${params.prompt} calm bedtime lullaby`,
          duration: params.duration,
          format: "mp3",
          intensity: params.intensity || "low",
          mode: "track",
        },
      }),
    });

    const generateData = await generateResponse.json();

    if (generateData?.data?.tasks?.[0]?.download_link) {
      return generateData.data.tasks[0].download_link;
    }

    return null;
  } catch (error) {
    console.error("Mubert generation failed:", error);
    return null;
  }
}

/**
 * Get background music URL - tries Mubert first, falls back to curated tracks
 */
export async function getBackgroundMusic(
  theme: string,
  backgroundMusicPrompt?: string,
  duration: number = 300
): Promise<{ url: string; source: "mubert" | "library" }> {
  // Try Mubert if API key is available
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

  // Fall back to curated library
  const track = selectMusicTrack(theme, backgroundMusicPrompt);
  return { url: track.url, source: "library" };
}

// ============================================
// SUNO AI INTEGRATION (via Kie.ai API)
// ============================================

import { isSunoConfigured, generateMusicAndDownload } from "./suno";
import { generateMusicPrompt } from "./gemini";

export interface SunoMusicResult {
  url: string;
  source: "suno" | "library";
  buffer?: Buffer;
}

/**
 * Get background music using Suno AI
 * Analyzes the story content with Gemini to generate a detailed music prompt,
 * then uses Suno AI to generate custom music that matches the story.
 * Falls back to curated library if Suno fails.
 *
 * @param storyText - The full story text to analyze
 * @param theme - Story theme (adventure, animals, space, etc.)
 * @param childAge - Child's age for age-appropriate music
 * @param duration - Desired music duration in seconds
 * @param timeoutMs - Max time to wait for Suno generation
 */
export async function getBackgroundMusicWithSuno(
  storyText: string,
  theme: string,
  childAge: number,
  duration: number = 300,
  timeoutMs: number = 120000
): Promise<SunoMusicResult> {
  // Check if Suno is configured
  if (!isSunoConfigured()) {
    console.log("[Music] Suno not configured, using library fallback");
    const track = selectMusicTrack(theme);
    return { url: track.url, source: "library" };
  }

  try {
    // Step 1: Generate detailed music prompt using Gemini
    console.log("[Music] Generating music prompt from story content...");
    const musicPrompt = await generateMusicPrompt(storyText, theme, childAge);

    console.log(`[Music] Music prompt generated: "${musicPrompt.title}"`);
    console.log(`[Music] Style: ${musicPrompt.style}`);

    // Step 2: Generate music with Suno
    console.log("[Music] Generating music with Suno AI...");
    const result = await generateMusicAndDownload(
      {
        prompt: musicPrompt.prompt,
        style: musicPrompt.style,
        title: musicPrompt.title,
        instrumental: true,
      },
      timeoutMs
    );

    if (result) {
      console.log(`[Music] Suno music generated successfully (${result.buffer.length} bytes)`);
      return {
        url: result.url,
        source: "suno",
        buffer: result.buffer,
      };
    }

    // Suno failed, fall back to library
    console.warn("[Music] Suno generation failed, falling back to library");
  } catch (error) {
    console.error("[Music] Error generating Suno music:", error);
  }

  // Fallback to curated library
  const track = selectMusicTrack(theme);
  console.log(`[Music] Using library track: ${track.name}`);
  return { url: track.url, source: "library" };
}
