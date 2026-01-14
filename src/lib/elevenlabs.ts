const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const BASE_URL = "https://api.elevenlabs.io/v1";

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
  speed?: number; // 0.7 (slowest) to 1.2 (fastest), default 1.0
}

// Default settings for calming bedtime narration with v3
// Lower stability = more expressive/emotional
// Higher similarity = closer to original voice
// Speed 0.7 = slowest possible for sleepy bedtime stories
const BEDTIME_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,        // More expressive for storytelling
  similarity_boost: 0.75,
  style: 0.4,            // Natural style for bedtime
  use_speaker_boost: true,
  speed: 0.7,            // Slowest speed for sleep-inducing narration
};

/**
 * Clone a voice from an audio sample
 * Returns the voice_id to be stored for the user
 */
export async function cloneVoice(
  audioBuffer: Buffer,
  name: string
): Promise<string> {
  const formData = new FormData();
  formData.append("name", name);
  // Convert Buffer to ArrayBuffer for Blob compatibility
  const arrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  ) as ArrayBuffer;
  formData.append("files", new Blob([arrayBuffer], { type: "audio/mpeg" }), "sample.mp3");
  formData.append("description", "Voice Bedtime Tales - Parent Voice");

  const response = await fetch(`${BASE_URL}/voices/add`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs voice clone failed: ${error}`);
  }

  const data = await response.json();
  return data.voice_id;
}

/**
 * Generate speech from text using a cloned voice
 * Uses eleven_v3 model for best expressiveness with audio tags
 *
 * Supported audio tags for bedtime stories:
 * - [softly], [gently], [warmly] - tone modifiers
 * - [whispers] - for quiet intimate moments
 * - [pause], [long pause] - natural breaks
 * - [sighs], [yawns] - sleepy atmosphere
 * - [excited], [curious] - for story moments
 *
 * Returns audio buffer (MP3)
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  settings: VoiceSettings = BEDTIME_VOICE_SETTINGS
): Promise<Buffer> {
  const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_v3",  // v3 for audio tag support
      voice_settings: settings, // speed is now inside voice_settings (0.7 = slowest)
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a cloned voice (for cleanup if needed)
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/voices/${voiceId}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs voice delete failed: ${error}`);
  }
}

/**
 * Get voice info
 */
export async function getVoice(voiceId: string): Promise<{ name: string } | null> {
  const response = await fetch(`${BASE_URL}/voices/${voiceId}`, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
