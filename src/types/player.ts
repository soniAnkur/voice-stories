// Player Types for Spotify-style media player

export interface StoryForPlayer {
  _id: string;
  childName: string;
  childAge: number;
  interests: string;
  theme: string;
  previewUrl?: string;
  fullAudioUrl?: string;
  status: "preview" | "paid" | "generating" | "complete" | "failed";
  createdAt: string;
  updatedAt: string;
  // Effective voice ID (resolved from story.voiceId or user.elevenlabsVoiceId)
  effectiveVoiceId?: string;
  ownerEmail?: string;
}

export interface Album {
  voiceId: string;
  ownerEmail: string | null;
  storyCount: number;
  latestStoryDate: string;
  // First 4 stories for album art grid
  coverStories: Pick<StoryForPlayer, "_id" | "theme" | "childName">[];
}

export interface PlayerState {
  currentStory: StoryForPlayer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: StoryForPlayer[];
  queueIndex: number;
  isExpanded: boolean;
  isMiniVisible: boolean;
}

export type PlayerAction =
  | { type: "PLAY_STORY"; story: StoryForPlayer; queue?: StoryForPlayer[] }
  | { type: "TOGGLE_PLAY" }
  | { type: "PAUSE" }
  | { type: "SEEK"; time: number }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "EXPAND" }
  | { type: "COLLAPSE" }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "TRACK_ENDED" }
  | { type: "CLOSE" };

export interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

// Theme to emoji mapping for album art
export const THEME_EMOJIS: Record<string, string> = {
  adventure: "🏔️",
  animals: "🦁",
  space: "🚀",
  ocean: "🐠",
  fairy: "🧚",
  dinosaurs: "🦕",
};

// Theme to gradient mapping for album backgrounds
export const THEME_GRADIENTS: Record<string, string> = {
  adventure: "from-amber-400 to-orange-500",
  animals: "from-green-400 to-emerald-500",
  space: "from-indigo-400 to-purple-500",
  ocean: "from-cyan-400 to-blue-500",
  fairy: "from-pink-400 to-rose-500",
  dinosaurs: "from-lime-400 to-green-500",
};
