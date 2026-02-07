/**
 * Music selection for story backgrounds
 *
 * Strategy: Map story themes/moods to curated royalty-free tracks
 * All tracks are CC0 licensed (public domain) - free for commercial use
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

/**
 * Get background music URL from curated library
 * Selects best matching track based on theme and music prompt
 */
export async function getBackgroundMusic(
  theme: string,
  backgroundMusicPrompt?: string,
  _duration: number = 300
): Promise<{ url: string; source: "library" }> {
  const track = selectMusicTrack(theme, backgroundMusicPrompt);
  return { url: track.url, source: "library" };
}
