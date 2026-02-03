/**
 * Simple audio mixer for combining narration with background music
 *
 * Pure JavaScript implementation using:
 * - mpg123-decoder for MP3 decoding (WASM-based)
 * - @breezystack/lamejs for MP3 encoding
 *
 * No FFmpeg dependency required - works on Vercel serverless!
 */

import { MPEGDecoder } from "mpg123-decoder";
import { readFile } from "fs/promises";
import { join } from "path";

// Dynamic import for lamejs (ESM module)
let Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
  encodeBuffer: (left: Int16Array, right?: Int16Array) => Int8Array;
  flush: () => Int8Array;
};

async function getLamejs() {
  if (!Mp3Encoder) {
    const lamejs = await import("@breezystack/lamejs");
    Mp3Encoder = lamejs.default.Mp3Encoder;
  }
  return Mp3Encoder;
}

export interface SimpleMixOptions {
  narrationBuffer: Buffer;
  musicUrl: string;
  musicVolume?: number; // 0.0 - 1.0, default 0.20
  fadeInDuration?: number; // seconds, default 2
  fadeOutDuration?: number; // seconds, default 3
}

export interface SimpleMixResult {
  buffer: Buffer;
  duration: number;
}

/**
 * Mix narration audio with background music using pure JavaScript
 * No FFmpeg required - works on Vercel serverless
 */
export async function mixAudioSimple(
  options: SimpleMixOptions
): Promise<SimpleMixResult> {
  const {
    narrationBuffer,
    musicUrl,
    musicVolume = 0.20,
    fadeInDuration = 2,
    fadeOutDuration = 3,
  } = options;

  console.log("[SimpleAudioMixer] Starting audio mix...");
  console.log(`[SimpleAudioMixer] Music URL: ${musicUrl}`);
  console.log(`[SimpleAudioMixer] Music volume: ${musicVolume}`);

  // 1. Decode narration MP3 to PCM
  const narrationPcm = await decodeMp3(narrationBuffer);
  console.log(
    `[SimpleAudioMixer] Narration decoded: ${narrationPcm.left.length} samples at ${narrationPcm.sampleRate}Hz`
  );

  // 2. Fetch and decode music
  const musicBuffer = await fetchMusic(musicUrl);
  const musicPcm = await decodeMp3(musicBuffer);
  console.log(
    `[SimpleAudioMixer] Music decoded: ${musicPcm.left.length} samples at ${musicPcm.sampleRate}Hz`
  );

  // 3. Resample music if needed to match narration sample rate
  let musicLeft = musicPcm.left;
  let musicRight = musicPcm.right;
  if (musicPcm.sampleRate !== narrationPcm.sampleRate) {
    console.log(
      `[SimpleAudioMixer] Resampling music from ${musicPcm.sampleRate}Hz to ${narrationPcm.sampleRate}Hz`
    );
    const resampled = resample(
      musicLeft,
      musicRight,
      musicPcm.sampleRate,
      narrationPcm.sampleRate
    );
    musicLeft = resampled.left;
    musicRight = resampled.right;
  }

  // 4. Loop music to match narration length
  const targetLength = narrationPcm.left.length;
  const loopedMusic = loopAudio(musicLeft, musicRight, targetLength);
  console.log(`[SimpleAudioMixer] Music looped to ${targetLength} samples`);

  // 5. Apply fade in/out to music
  const fadedMusic = applyFades(
    loopedMusic.left,
    loopedMusic.right,
    narrationPcm.sampleRate,
    fadeInDuration,
    fadeOutDuration
  );

  // 6. Mix at specified volumes (narration at 100%, music at specified volume)
  const mixed = mixPcm(
    narrationPcm.left,
    narrationPcm.right,
    fadedMusic.left,
    fadedMusic.right,
    1.0,
    musicVolume
  );
  console.log(`[SimpleAudioMixer] Audio mixed`);

  // 7. Encode to MP3
  const mp3Buffer = await encodeMp3(
    mixed.left,
    mixed.right,
    narrationPcm.sampleRate
  );
  console.log(`[SimpleAudioMixer] MP3 encoded: ${mp3Buffer.length} bytes`);

  const duration = narrationPcm.left.length / narrationPcm.sampleRate;

  return {
    buffer: mp3Buffer,
    duration,
  };
}

interface PcmData {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}

/**
 * Decode MP3 buffer to PCM samples
 */
async function decodeMp3(mp3Buffer: Buffer): Promise<PcmData> {
  const decoder = new MPEGDecoder();
  await decoder.ready;

  const uint8Array = new Uint8Array(mp3Buffer);
  const { channelData, sampleRate } = decoder.decode(uint8Array);

  decoder.free();

  // Handle mono audio (duplicate to stereo)
  const left = channelData[0];
  const right = channelData.length > 1 ? channelData[1] : channelData[0];

  return { left, right, sampleRate };
}

/**
 * Fetch music from URL or local file
 */
async function fetchMusic(url: string): Promise<Buffer> {
  // Handle local files (for development)
  if (url.startsWith("/")) {
    const localPath = join(process.cwd(), "public", url);
    return await readFile(localPath);
  }

  // Download from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download music: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Simple linear resampling
 */
function resample(
  left: Float32Array,
  right: Float32Array,
  fromRate: number,
  toRate: number
): { left: Float32Array; right: Float32Array } {
  const ratio = fromRate / toRate;
  const newLength = Math.floor(left.length / ratio);

  const newLeft = new Float32Array(newLength);
  const newRight = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, left.length - 1);
    const frac = srcIndex - srcIndexFloor;

    // Linear interpolation
    newLeft[i] = left[srcIndexFloor] * (1 - frac) + left[srcIndexCeil] * frac;
    newRight[i] =
      right[srcIndexFloor] * (1 - frac) + right[srcIndexCeil] * frac;
  }

  return { left: newLeft, right: newRight };
}

/**
 * Loop audio to target length
 */
function loopAudio(
  left: Float32Array,
  right: Float32Array,
  targetLength: number
): { left: Float32Array; right: Float32Array } {
  const newLeft = new Float32Array(targetLength);
  const newRight = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i % left.length;
    newLeft[i] = left[srcIndex];
    newRight[i] = right[srcIndex];
  }

  return { left: newLeft, right: newRight };
}

/**
 * Apply fade in and fade out to audio
 */
function applyFades(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  fadeInDuration: number,
  fadeOutDuration: number
): { left: Float32Array; right: Float32Array } {
  const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);
  const fadeOutStart = left.length - fadeOutSamples;

  const newLeft = new Float32Array(left);
  const newRight = new Float32Array(right);

  // Fade in
  for (let i = 0; i < fadeInSamples && i < left.length; i++) {
    const gain = i / fadeInSamples;
    newLeft[i] *= gain;
    newRight[i] *= gain;
  }

  // Fade out
  for (let i = fadeOutStart; i < left.length; i++) {
    const gain = (left.length - i) / fadeOutSamples;
    newLeft[i] *= gain;
    newRight[i] *= gain;
  }

  return { left: newLeft, right: newRight };
}

/**
 * Mix two stereo audio streams
 */
function mixPcm(
  voice_left: Float32Array,
  voice_right: Float32Array,
  music_left: Float32Array,
  music_right: Float32Array,
  voiceVolume: number,
  musicVolume: number
): { left: Float32Array; right: Float32Array } {
  const length = Math.min(voice_left.length, music_left.length);
  const left = new Float32Array(length);
  const right = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    // Mix with volume adjustment
    left[i] = voice_left[i] * voiceVolume + music_left[i] * musicVolume;
    right[i] = voice_right[i] * voiceVolume + music_right[i] * musicVolume;

    // Soft clip to prevent distortion
    left[i] = softClip(left[i]);
    right[i] = softClip(right[i]);
  }

  return { left, right };
}

/**
 * Soft clipping to prevent harsh distortion
 */
function softClip(sample: number): number {
  if (sample > 1.0) {
    return 1.0 - Math.exp(-(sample - 1.0));
  } else if (sample < -1.0) {
    return -1.0 + Math.exp(-(-sample - 1.0));
  }
  return sample;
}

/**
 * Encode PCM samples to MP3
 */
async function encodeMp3(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Promise<Buffer> {
  // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
  const leftInt16 = float32ToInt16(left);
  const rightInt16 = float32ToInt16(right);

  // Get the MP3 encoder class
  const EncoderClass = await getLamejs();

  // Create MP3 encoder (stereo, sample rate, 192kbps)
  const mp3encoder = new EncoderClass(2, sampleRate, 192);
  const mp3Data: Int8Array[] = [];

  const sampleBlockSize = 1152;

  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }

  // Flush the encoder
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }

  // Combine all chunks into a single buffer
  const totalLength = mp3Data.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Data) {
    result.set(new Uint8Array(chunk.buffer), offset);
    offset += chunk.length;
  }

  return Buffer.from(result);
}

/**
 * Convert Float32Array to Int16Array
 */
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    // Clamp to -1.0 to 1.0 range
    const sample = Math.max(-1, Math.min(1, float32[i]));
    // Convert to 16-bit integer
    int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  return int16;
}
