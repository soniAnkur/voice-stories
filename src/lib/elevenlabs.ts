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

// Maximum characters per TTS request (ElevenLabs limit is 5000)
const MAX_CHUNK_SIZE = 4500; // Leave some buffer

/**
 * Split text into chunks at natural boundaries (sentences/paragraphs)
 */
function splitTextIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    // Find the best split point within the limit
    let splitIndex = maxSize;
    const searchArea = remaining.slice(0, maxSize);

    // Try to split at paragraph break first
    const lastParagraph = searchArea.lastIndexOf('\n\n');
    if (lastParagraph > maxSize * 0.5) {
      splitIndex = lastParagraph + 2;
    } else {
      // Try to split at sentence end
      const lastSentence = Math.max(
        searchArea.lastIndexOf('. '),
        searchArea.lastIndexOf('! '),
        searchArea.lastIndexOf('? '),
        searchArea.lastIndexOf('." '),
        searchArea.lastIndexOf('.\n')
      );
      if (lastSentence > maxSize * 0.5) {
        splitIndex = lastSentence + 2;
      } else {
        // Last resort: split at [long pause] or [pause] tags
        const lastPause = Math.max(
          searchArea.lastIndexOf('[long pause]'),
          searchArea.lastIndexOf('[pause]')
        );
        if (lastPause > maxSize * 0.3) {
          // Include the pause tag in the first chunk
          const pauseTag = searchArea.includes('[long pause]') ? '[long pause]' : '[pause]';
          splitIndex = lastPause + pauseTag.length;
        }
      }
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  return chunks;
}

/**
 * Generate speech from text using a cloned voice
 * Uses eleven_v3 model for best expressiveness with audio tags
 * Automatically handles long texts by chunking
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
  // Split into chunks if text is too long
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);

  if (chunks.length === 1) {
    // Single chunk - normal request
    return singleTextToSpeech(chunks[0], voiceId, settings);
  }

  // Multiple chunks - generate audio for each and concatenate
  console.log(`   Splitting into ${chunks.length} chunks for TTS...`);
  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`   Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
    const buffer = await singleTextToSpeech(chunks[i], voiceId, settings);
    audioBuffers.push(buffer);
  }

  // Concatenate MP3 buffers (MP3 files can be simply concatenated)
  return Buffer.concat(audioBuffers);
}

/**
 * Single TTS request (under character limit)
 */
async function singleTextToSpeech(
  text: string,
  voiceId: string,
  settings: VoiceSettings
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
