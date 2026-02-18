/**
 * Video Stitcher - Concatenate and process videos using FFmpeg
 *
 * Uses ffmpeg-static for local FFmpeg binary, or system FFmpeg if available.
 * Works locally and on Vercel with proper configuration.
 *
 * Features:
 * - Concatenate multiple videos
 * - Slow down playback (0.25x - 1x)
 * - Loop videos to target duration
 * - Overlay audio track
 */

import { spawn, execSync } from "child_process";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Determine FFmpeg path - try multiple locations
function getFFmpegPath(): string {
  // 1. Try ffmpeg-static
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticPath = require("ffmpeg-static");
    if (staticPath && typeof staticPath === "string" && existsSync(staticPath)) {
      return staticPath;
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try system ffmpeg
  try {
    const systemPath = execSync("which ffmpeg", { encoding: "utf-8" }).trim();
    if (systemPath && existsSync(systemPath)) {
      return systemPath;
    }
  } catch {
    // Continue to fallback
  }

  // 3. Default to "ffmpeg" and hope it's in PATH
  return "ffmpeg";
}

const ffmpegPath = getFFmpegPath();

interface StitchVideosOptions {
  videoUrls: string[]; // URLs of videos to concatenate
  outputPath?: string; // Optional output path (generates temp file if not provided)
  slowdownFactor?: number; // 0.25 = 4x slower, 0.5 = 2x slower, 1 = normal
  targetDurationSec?: number; // Loop videos to reach this duration
  audioUrl?: string; // Optional audio to overlay
  audioVolume?: number; // 0.0 - 1.0, default 1.0
  onProgress?: (message: string) => void;
}

interface StitchResult {
  outputPath: string;
  durationSec: number;
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, localPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(localPath, buffer);
}

/**
 * Run FFmpeg command and return output
 */
function runFFmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args);
    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    process.on("error", (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });
  });
}

/**
 * Get video duration using ffprobe-style approach
 */
async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    // Use ffmpeg to probe the file - duration appears in stderr
    const process = spawn(ffmpegPath, ["-i", filePath, "-f", "null", "-"]);
    let stderr = "";

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", () => {
      // Parse duration from stderr: "Duration: HH:MM:SS.ms"
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        resolve(hours * 3600 + minutes * 60 + seconds);
      } else {
        resolve(0);
      }
    });

    process.on("error", () => {
      resolve(0);
    });
  });
}

/**
 * Concatenate multiple videos into one
 */
export async function stitchVideos(
  options: StitchVideosOptions
): Promise<StitchResult> {
  const {
    videoUrls,
    outputPath,
    slowdownFactor = 1,
    targetDurationSec,
    audioUrl,
    audioVolume = 1.0,
    onProgress,
  } = options;

  const log = onProgress || console.log;
  const workDir = join(tmpdir(), `video-stitch-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  log(`\n=== Video Stitching Started ===`);
  log(`   Videos: ${videoUrls.length}`);
  log(`   Slowdown: ${slowdownFactor}x`);
  log(`   Target duration: ${targetDurationSec || "auto"}s`);
  log(`   Work dir: ${workDir}`);

  try {
    // Step 1: Download all videos
    log(`\nStep 1: Downloading ${videoUrls.length} videos...`);
    const localVideos: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const localPath = join(workDir, `video_${i}.mp4`);
      await downloadFile(videoUrls[i], localPath);
      localVideos.push(localPath);
      log(`   Downloaded video ${i + 1}/${videoUrls.length}`);
    }

    // Step 2: Create concat file list
    log(`\nStep 2: Creating concat list...`);
    const concatListPath = join(workDir, "concat.txt");
    const concatContent = localVideos.map((p) => `file '${p}'`).join("\n");
    await writeFile(concatListPath, concatContent);

    // Step 3: Concatenate videos
    log(`\nStep 3: Concatenating videos...`);
    const concatOutputPath = join(workDir, "concatenated.mp4");
    await runFFmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-c",
      "copy",
      concatOutputPath,
    ]);

    let currentPath = concatOutputPath;
    let currentDuration = await getVideoDuration(concatOutputPath);
    log(`   Concatenated duration: ${currentDuration.toFixed(1)}s`);

    // Step 4: Apply slowdown if needed
    if (slowdownFactor < 1) {
      log(`\nStep 4: Applying ${slowdownFactor}x slowdown...`);
      const slowedPath = join(workDir, "slowed.mp4");
      const pts = 1 / slowdownFactor; // PTS multiplier for slowdown

      await runFFmpeg([
        "-i",
        currentPath,
        "-filter:v",
        `setpts=${pts}*PTS`,
        "-an", // Remove audio for now (will add back later)
        slowedPath,
      ]);

      currentPath = slowedPath;
      currentDuration = await getVideoDuration(slowedPath);
      log(`   Slowed duration: ${currentDuration.toFixed(1)}s`);
    }

    // Step 5: Loop to target duration if needed
    if (targetDurationSec && currentDuration < targetDurationSec) {
      log(`\nStep 5: Looping to ${targetDurationSec}s...`);
      const loopedPath = join(workDir, "looped.mp4");
      const loopCount = Math.ceil(targetDurationSec / currentDuration);

      // Create loop concat file
      const loopListPath = join(workDir, "loop.txt");
      const loopContent = Array(loopCount)
        .fill(`file '${currentPath}'`)
        .join("\n");
      await writeFile(loopListPath, loopContent);

      await runFFmpeg([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        loopListPath,
        "-t",
        String(targetDurationSec),
        "-c",
        "copy",
        loopedPath,
      ]);

      currentPath = loopedPath;
      currentDuration = targetDurationSec;
      log(`   Looped duration: ${currentDuration.toFixed(1)}s`);
    }

    // Step 6: Overlay audio if provided
    if (audioUrl) {
      log(`\nStep 6: Overlaying audio...`);
      const audioPath = join(workDir, "audio.mp3");
      await downloadFile(audioUrl, audioPath);

      const withAudioPath = join(workDir, "with_audio.mp4");
      await runFFmpeg([
        "-i",
        currentPath,
        "-i",
        audioPath,
        "-filter_complex",
        `[1:a]volume=${audioVolume}[a]`,
        "-map",
        "0:v",
        "-map",
        "[a]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-shortest",
        withAudioPath,
      ]);

      currentPath = withAudioPath;
      log(`   Audio overlaid`);
    }

    // Step 7: Copy to final output
    const finalPath = outputPath || join(workDir, "final.mp4");
    if (currentPath !== finalPath) {
      const buffer = await readFile(currentPath);
      await writeFile(finalPath, buffer);
    }

    log(`\n=== Video Stitching Complete ===`);
    log(`   Output: ${finalPath}`);
    log(`   Duration: ${currentDuration.toFixed(1)}s`);

    return {
      outputPath: finalPath,
      durationSec: currentDuration,
    };
  } finally {
    // Cleanup work directory (optional - comment out for debugging)
    // await rm(workDir, { recursive: true, force: true });
  }
}

/**
 * Simple video concatenation without effects
 */
export async function concatVideosSimple(
  videoUrls: string[],
  outputPath?: string
): Promise<string> {
  const result = await stitchVideos({ videoUrls, outputPath });
  return result.outputPath;
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await runFFmpeg(["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get FFmpeg version info
 */
export async function getFFmpegVersion(): Promise<string> {
  try {
    const output = await runFFmpeg(["-version"]);
    const firstLine = output.split("\n")[0];
    return firstLine || "Unknown";
  } catch (e) {
    // Version info is in stderr
    const errorMsg = (e as Error).message;
    const match = errorMsg.match(/ffmpeg version ([^\s]+)/);
    return match ? match[1] : "Available (version unknown)";
  }
}
