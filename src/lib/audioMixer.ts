/**
 * Audio mixing utilities for combining narration with background music
 *
 * Uses FFmpeg via fluent-ffmpeg for professional audio mixing
 * Features:
 * - Volume ducking (lower music when voice is present)
 * - Crossfades and transitions
 * - Audio normalization
 * - Remote FFmpeg API support for Vercel deployment
 */

import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { uploadAudio } from "./blob";

export interface MixOptions {
  narrationBuffer: Buffer;
  musicUrl: string;
  musicVolume?: number; // 0.0 - 1.0, default 0.25
  fadeInDuration?: number; // seconds, default 2
  fadeOutDuration?: number; // seconds, default 3
  ducking?: boolean; // Lower music when voice present, default true
  duckingAmount?: number; // How much to lower music (0.0-1.0), default 0.5
  dreamyEffect?: boolean; // Add dreamy reverb/delay/echo to voice, default true
}

export interface MixResult {
  buffer: Buffer;
  duration: number;
  url?: string; // URL if uploaded to R2 (remote processing)
}

/**
 * Mix narration audio with background music
 * Automatically uses local FFmpeg or remote API based on availability
 */
export async function mixNarrationWithMusic(
  options: MixOptions
): Promise<MixResult> {
  // 1. Try local FFmpeg first (for development)
  if (await isFFmpegAvailable()) {
    console.log("[AudioMixer] Using local FFmpeg");
    return mixNarrationWithMusicLocal(options);
  }

  // 2. Use remote FFmpeg API (for Vercel production)
  if (process.env.FFMPEG_API_URL) {
    console.log("[AudioMixer] Using remote FFmpeg API");
    return mixNarrationWithMusicRemote(options);
  }

  // 3. Fallback: return narration only (no mixing)
  console.warn("[AudioMixer] No FFmpeg available, returning narration only");
  return {
    buffer: options.narrationBuffer,
    duration: 0,
  };
}

/**
 * Mix using remote FFmpeg API (for Vercel deployment)
 */
async function mixNarrationWithMusicRemote(
  options: MixOptions
): Promise<MixResult> {
  const {
    narrationBuffer,
    musicUrl,
    musicVolume = 0.25,
    fadeInDuration = 2,
    fadeOutDuration = 3,
    ducking = true,
    duckingAmount = 0.5,
    dreamyEffect = true,
  } = options;

  const apiUrl = process.env.FFMPEG_API_URL;
  const apiKey = process.env.FFMPEG_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("FFMPEG_API_URL and FFMPEG_API_KEY are required");
  }

  // Upload narration to R2 first so the VPS can access it
  const narrationUrl = await uploadAudio(
    narrationBuffer,
    `temp-narration-${randomUUID()}`,
    "preview",
    { childName: "temp" }
  );

  console.log(`[AudioMixer] Uploaded narration to: ${narrationUrl}`);

  // Convert relative music URL to absolute URL for VPS access
  let absoluteMusicUrl = musicUrl;
  if (musicUrl.startsWith("/")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicestories.vercel.app";
    absoluteMusicUrl = `${appUrl}${musicUrl}`;
  }

  console.log(`[AudioMixer] Music URL: ${absoluteMusicUrl}`);
  console.log(`[AudioMixer] Calling remote FFmpeg API: ${apiUrl}/api/mix`);

  const response = await fetch(`${apiUrl}/api/mix`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      narrationUrl,
      musicUrl: absoluteMusicUrl,
      musicVolume,
      fadeInDuration,
      fadeOutDuration,
      ducking,
      duckingAmount,
      applyDreamyEffects: dreamyEffect,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FFmpeg API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  if (!result.success || !result.mixedUrl) {
    throw new Error(`FFmpeg API failed: ${result.error || "Unknown error"}`);
  }

  console.log(`[AudioMixer] Mixed audio URL: ${result.mixedUrl}`);
  console.log(`[AudioMixer] Processing time: ${result.processingTime}ms`);

  // Download the mixed audio to return as buffer
  const mixedResponse = await fetch(result.mixedUrl);
  if (!mixedResponse.ok) {
    throw new Error(`Failed to download mixed audio: ${mixedResponse.status}`);
  }

  const mixedBuffer = Buffer.from(await mixedResponse.arrayBuffer());

  return {
    buffer: mixedBuffer,
    duration: 0, // Duration is already embedded in the mixed audio
    url: result.mixedUrl,
  };
}

/**
 * Mix using local FFmpeg (for development)
 */
async function mixNarrationWithMusicLocal(
  options: MixOptions
): Promise<MixResult> {
  const {
    narrationBuffer,
    musicUrl,
    musicVolume = 0.25,
    fadeInDuration = 2,
    fadeOutDuration = 3,
    ducking = true,
    duckingAmount = 0.5,
    dreamyEffect = true,
  } = options;

  const tempDir = join(tmpdir(), "voice-stories-mix");
  await mkdir(tempDir, { recursive: true });

  const sessionId = randomUUID();
  const narrationPath = join(tempDir, `narration-${sessionId}.mp3`);
  const musicPath = join(tempDir, `music-${sessionId}.mp3`);
  const outputPath = join(tempDir, `output-${sessionId}.mp3`);

  try {
    // Write narration to temp file
    await writeFile(narrationPath, narrationBuffer);

    // Download music to temp file
    await downloadFile(musicUrl, musicPath);

    // Get narration duration
    const duration = await getAudioDuration(narrationPath);

    // Build FFmpeg filter complex for mixing
    const filterComplex = buildMixFilter({
      narrationDuration: duration,
      musicVolume,
      fadeInDuration,
      fadeOutDuration,
      ducking,
      duckingAmount,
      dreamyEffect,
    });

    // Run FFmpeg
    await runFFmpeg([
      "-i", narrationPath,
      "-i", musicPath,
      "-filter_complex", filterComplex,
      "-map", "[final]",
      "-acodec", "libmp3lame",
      "-b:a", "192k",
      "-y",
      outputPath,
    ]);

    // Read output
    const outputBuffer = await readFile(outputPath);

    return {
      buffer: outputBuffer,
      duration,
    };
  } finally {
    // Cleanup temp files
    await cleanupFiles([narrationPath, musicPath, outputPath]);
  }
}

/**
 * Simple mix without ducking (lighter processing)
 */
export async function simpleMix(
  narrationBuffer: Buffer,
  musicUrl: string,
  musicVolume: number = 0.15
): Promise<Buffer> {
  const tempDir = join(tmpdir(), "voice-stories-mix");
  await mkdir(tempDir, { recursive: true });

  const sessionId = randomUUID();
  const narrationPath = join(tempDir, `narration-${sessionId}.mp3`);
  const musicPath = join(tempDir, `music-${sessionId}.mp3`);
  const outputPath = join(tempDir, `output-${sessionId}.mp3`);

  try {
    await writeFile(narrationPath, narrationBuffer);
    await downloadFile(musicUrl, musicPath);

    const duration = await getAudioDuration(narrationPath);

    // Simple filter: loop music, set volume, mix with narration
    const filter = [
      `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${duration},volume=${musicVolume},afade=t=in:st=0:d=2,afade=t=out:st=${duration - 3}:d=3[music]`,
      `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[final]`,
    ].join(";");

    await runFFmpeg([
      "-i", narrationPath,
      "-i", musicPath,
      "-filter_complex", filter,
      "-map", "[final]",
      "-acodec", "libmp3lame",
      "-b:a", "192k",
      "-y",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await cleanupFiles([narrationPath, musicPath, outputPath]);
  }
}

/**
 * Build FFmpeg filter for mixing with ducking (sidechaining) and dreamy effects
 */
function buildMixFilter(params: {
  narrationDuration: number;
  musicVolume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  ducking: boolean;
  duckingAmount: number;
  dreamyEffect: boolean;
}): string {
  const {
    narrationDuration,
    musicVolume,
    fadeInDuration,
    fadeOutDuration,
    ducking,
    duckingAmount,
    dreamyEffect,
  } = params;

  const fadeOutStart = Math.max(0, narrationDuration - fadeOutDuration);

  // Dreamy effect filter chain for bedtime stories:
  // 1. Soft lowpass to warm the voice (remove harsh highs)
  // 2. Echo/delay for spacious dreamy feel
  // 3. Reverb for ambient warmth
  // Combined creates a gentle, sleep-inducing sound
  const dreamyFilter = dreamyEffect
    ? [
        // Warm the voice by cutting harsh high frequencies
        "lowpass=f=8000",
        // Add gentle echo/delay (creates spacious dreamy feel)
        // delays in ms, decays control how much echo remains
        "aecho=0.8:0.5:100|200|300:0.5|0.35|0.2",
        // Add room reverb on top (longer delays for more noticeable reverb)
        "aecho=0.8:0.4:500|700:0.3|0.2",
      ].join(",") + ","
    : "";

  if (ducking) {
    // Advanced filter with sidechaining for ducking
    // Music volume drops when voice is detected
    return [
      // Apply dreamy effects to narration voice
      `[0:a]${dreamyFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
      // Loop and trim music to match narration length
      `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${narrationDuration}[musicloop]`,
      // Apply base volume and fades to music
      `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}[musicfaded]`,
      // Sidechain compression: duck music when voice is present
      `[musicfaded][voice]sidechaincompress=threshold=0.02:ratio=4:attack=50:release=400:level_sc=${1 - duckingAmount}[musicducked]`,
      // Mix narration with ducked music
      `[voice][musicducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
    ].join(";");
  }

  // Simple mix without ducking but with dreamy effects
  return [
    `[0:a]${dreamyFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`,
    `[1:a]aloop=loop=-1:size=2e+09,atrim=0:${narrationDuration}[musicloop]`,
    `[musicloop]volume=${musicVolume},afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}[musicfaded]`,
    `[voice][musicfaded]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[final]`,
  ].join(";");
}

/**
 * Get audio duration in seconds using FFprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()) || 0);
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on("error", reject);
  });
}

/**
 * Run FFmpeg with given arguments
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`FFmpeg not found or failed to start: ${err.message}`));
    });
  });
}

/**
 * Download file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  // Handle local files (for development)
  if (url.startsWith("/")) {
    const localPath = join(process.cwd(), "public", url);
    const data = await readFile(localPath);
    await writeFile(destPath, data);
    return;
  }

  // Download from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destPath, Buffer.from(arrayBuffer));
}

/**
 * Cleanup temporary files
 */
async function cleanupFiles(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await unlink(path);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"]);
    ffmpeg.on("close", (code) => resolve(code === 0));
    ffmpeg.on("error", () => resolve(false));
  });
}

/**
 * Normalize audio levels for consistent playback
 */
export async function normalizeAudio(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = join(tmpdir(), "voice-stories-mix");
  await mkdir(tempDir, { recursive: true });

  const sessionId = randomUUID();
  const inputPath = join(tempDir, `input-${sessionId}.mp3`);
  const outputPath = join(tempDir, `normalized-${sessionId}.mp3`);

  try {
    await writeFile(inputPath, inputBuffer);

    await runFFmpeg([
      "-i", inputPath,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-acodec", "libmp3lame",
      "-b:a", "192k",
      "-y",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await cleanupFiles([inputPath, outputPath]);
  }
}
