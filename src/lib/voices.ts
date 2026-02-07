/**
 * Voice Presets Library
 *
 * Provides a selection of pre-configured ElevenLabs voices for users
 * who don't want to clone their own voice. These are high-quality
 * voices optimized for bedtime storytelling.
 */

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  style: "storyteller" | "nurturing" | "calming" | "playful";
  previewUrl: string;
  isDefault: boolean;
}

/**
 * Curated list of ElevenLabs voices suitable for bedtime stories
 * These are all official ElevenLabs voices with proven quality
 */
export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Warm, deep male voice - perfect for classic storytelling",
    gender: "male",
    style: "storyteller",
    previewUrl: "/voice-samples/adam.mp3",
    isDefault: true,
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Soft, gentle female voice - soothing and nurturing",
    gender: "female",
    style: "nurturing",
    previewUrl: "/voice-samples/bella.mp3",
    isDefault: false,
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Clear, expressive female voice - calm and reassuring",
    gender: "female",
    style: "calming",
    previewUrl: "/voice-samples/rachel.mp3",
    isDefault: false,
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    description: "Playful, energetic female voice - great for adventures",
    gender: "female",
    style: "playful",
    previewUrl: "/voice-samples/domi.mp3",
    isDefault: false,
  },
  {
    id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam",
    description: "Friendly, warm male voice - like a caring uncle",
    gender: "male",
    style: "nurturing",
    previewUrl: "/voice-samples/sam.mp3",
    isDefault: false,
  },
  {
    id: "jBpfuIE2acCO8z3wKNLl",
    name: "Gigi",
    description: "Sweet, childlike female voice - playful and fun",
    gender: "female",
    style: "playful",
    previewUrl: "/voice-samples/gigi.mp3",
    isDefault: false,
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel",
    description: "British male voice - sophisticated storytelling",
    gender: "male",
    style: "storyteller",
    previewUrl: "/voice-samples/daniel.mp3",
    isDefault: false,
  },
  {
    id: "ThT5KcBeYPX3keUQqHPh",
    name: "Dorothy",
    description: "Warm grandmother voice - cozy bedtime feeling",
    gender: "female",
    style: "nurturing",
    previewUrl: "/voice-samples/dorothy.mp3",
    isDefault: false,
  },
];

/**
 * Get all available voice presets
 */
export function getVoicePresets(): VoicePreset[] {
  return VOICE_PRESETS;
}

/**
 * Get a voice preset by ID
 */
export function getVoicePresetById(id: string): VoicePreset | null {
  return VOICE_PRESETS.find((v) => v.id === id) || null;
}

/**
 * Get the default voice preset
 */
export function getDefaultVoicePreset(): VoicePreset {
  return VOICE_PRESETS.find((v) => v.isDefault) || VOICE_PRESETS[0];
}

/**
 * Get voice presets filtered by style
 */
export function getVoicePresetsByStyle(
  style: VoicePreset["style"]
): VoicePreset[] {
  return VOICE_PRESETS.filter((v) => v.style === style);
}

/**
 * Get voice presets filtered by gender
 */
export function getVoicePresetsByGender(
  gender: VoicePreset["gender"]
): VoicePreset[] {
  return VOICE_PRESETS.filter((v) => v.gender === gender);
}

/**
 * Check if a voice ID is a preset voice
 */
export function isPresetVoice(voiceId: string): boolean {
  return VOICE_PRESETS.some((v) => v.id === voiceId);
}

/**
 * Voice type for user preference
 */
export type VoiceType = "cloned" | "preset";

/**
 * Get the voice ID to use based on user preferences
 * Returns the cloned voice ID if available, otherwise the preset voice ID
 */
export function getEffectiveVoiceId(
  voiceType: VoiceType,
  clonedVoiceId?: string,
  presetVoiceId?: string
): string {
  if (voiceType === "cloned" && clonedVoiceId) {
    return clonedVoiceId;
  }

  if (presetVoiceId) {
    return presetVoiceId;
  }

  // Default to the default preset
  return getDefaultVoicePreset().id;
}
