/**
 * Ken Burns Video Generation using FFmpeg
 *
 * Creates smooth pan/zoom animations from static images using FFmpeg's zoompan filter.
 * This provides FREE video generation (no API costs) as an alternative to AI video generation.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

/**
 * FFmpeg camera movement parameters for Ken Burns effect
 */
export interface FFmpegCameraMovement {
  effect: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down';
  startZoom: number;    // 1.0 = normal, 1.5 = 50% zoomed in
  endZoom: number;
  startX: number;       // 0-1 normalized position (0.5 = center)
  startY: number;
  endX: number;
  endY: number;
  easing: 'linear' | 'ease-in' | 'ease-out';
}

export interface KenBurnsOptions {
  imageUrl: string;
  duration: number;           // seconds
  camera: FFmpegCameraMovement;
  outputDir?: string;
  width?: number;
  height?: number;
  fps?: number;
}

export interface KenBurnsResult {
  videoPath: string;
  duration: number;
  width: number;
  height: number;
}

/**
 * Download an image from URL to a local file
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(outputPath, Buffer.from(buffer));
}

/**
 * Generate FFmpeg zoompan filter string based on camera parameters
 */
function generateZoompanFilter(
  camera: FFmpegCameraMovement,
  duration: number,
  fps: number,
  width: number,
  height: number
): string {
  const totalFrames = duration * fps;

  // Calculate zoom expression
  // Zoom changes from startZoom to endZoom over the duration
  const zoomDiff = camera.endZoom - camera.startZoom;
  let zoomExpr: string;

  if (camera.easing === 'ease-out') {
    // Ease out: fast start, slow end (good for calming endings)
    zoomExpr = `${camera.startZoom}+${zoomDiff}*sqrt(on/${totalFrames})`;
  } else if (camera.easing === 'ease-in') {
    // Ease in: slow start, fast end (good for building excitement)
    zoomExpr = `${camera.startZoom}+${zoomDiff}*pow(on/${totalFrames},2)`;
  } else {
    // Linear
    zoomExpr = `${camera.startZoom}+${zoomDiff}*(on/${totalFrames})`;
  }

  // Calculate X position expression
  // X moves from startX to endX normalized position
  // In FFmpeg zoompan, x position is relative to zoomed image
  // x = (normalized_position * image_width) - (viewport_width / 2 / zoom)
  const xStart = camera.startX;
  const xEnd = camera.endX;
  const xDiff = xEnd - xStart;
  let xExpr: string;

  if (camera.easing === 'ease-out') {
    xExpr = `(${xStart}+${xDiff}*sqrt(on/${totalFrames}))*(iw-iw/zoom)`;
  } else if (camera.easing === 'ease-in') {
    xExpr = `(${xStart}+${xDiff}*pow(on/${totalFrames},2))*(iw-iw/zoom)`;
  } else {
    xExpr = `(${xStart}+${xDiff}*(on/${totalFrames}))*(iw-iw/zoom)`;
  }

  // Calculate Y position expression
  const yStart = camera.startY;
  const yEnd = camera.endY;
  const yDiff = yEnd - yStart;
  let yExpr: string;

  if (camera.easing === 'ease-out') {
    yExpr = `(${yStart}+${yDiff}*sqrt(on/${totalFrames}))*(ih-ih/zoom)`;
  } else if (camera.easing === 'ease-in') {
    yExpr = `(${yStart}+${yDiff}*pow(on/${totalFrames},2))*(ih-ih/zoom)`;
  } else {
    yExpr = `(${yStart}+${yDiff}*(on/${totalFrames}))*(ih-ih/zoom)`;
  }

  // Build the zoompan filter
  // zoompan=z='zoom_expr':x='x_expr':y='y_expr':d=total_frames:s=WxH:fps=fps
  return `zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
}

/**
 * Generate a video with Ken Burns effect from a single image
 */
export async function generateKenBurnsVideo(
  options: KenBurnsOptions
): Promise<KenBurnsResult> {
  const {
    imageUrl,
    duration,
    camera,
    outputDir = os.tmpdir(),
    width = 1280,
    height = 720,
    fps = 30,
  } = options;

  // Create unique file names
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const imagePath = path.join(outputDir, `kenburns-input-${timestamp}-${randomId}.jpg`);
  const videoPath = path.join(outputDir, `kenburns-output-${timestamp}-${randomId}.mp4`);

  console.log(`\n[KenBurns] Starting video generation`);
  console.log(`[KenBurns] Image URL: ${imageUrl}`);
  console.log(`[KenBurns] Effect: ${camera.effect}`);
  console.log(`[KenBurns] Duration: ${duration}s, FPS: ${fps}`);
  console.log(`[KenBurns] Resolution: ${width}x${height}`);

  try {
    // Step 1: Download the image
    console.log(`[KenBurns] Downloading image...`);
    await downloadImage(imageUrl, imagePath);
    console.log(`[KenBurns] Image saved to: ${imagePath}`);

    // Step 2: Generate the zoompan filter
    const zoompanFilter = generateZoompanFilter(camera, duration, fps, width, height);
    console.log(`[KenBurns] Filter: ${zoompanFilter.substring(0, 100)}...`);

    // Step 3: Run FFmpeg command
    // First scale the image to ensure it's large enough for zoom operations
    // Then apply zoompan filter
    const ffmpegCommand = `ffmpeg -y -loop 1 -i "${imagePath}" \
      -vf "scale=iw*4:ih*4,${zoompanFilter}" \
      -t ${duration} \
      -c:v libx264 \
      -preset medium \
      -crf 23 \
      -pix_fmt yuv420p \
      -movflags +faststart \
      "${videoPath}"`;

    console.log(`[KenBurns] Running FFmpeg...`);
    const { stdout, stderr } = await execAsync(ffmpegCommand);

    if (stderr && !stderr.includes('frame=')) {
      console.log(`[KenBurns] FFmpeg stderr: ${stderr.substring(0, 200)}`);
    }

    // Step 4: Verify output exists
    const stats = await fs.promises.stat(videoPath);
    console.log(`[KenBurns] Video generated: ${videoPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Clean up input image
    await fs.promises.unlink(imagePath).catch(() => {});

    return {
      videoPath,
      duration,
      width,
      height,
    };
  } catch (error) {
    // Clean up on error
    await fs.promises.unlink(imagePath).catch(() => {});
    await fs.promises.unlink(videoPath).catch(() => {});

    console.error(`[KenBurns] Error:`, error);
    throw error;
  }
}

/**
 * Generate default camera movement for a section number
 */
export function getDefaultCameraForSection(sectionNumber: number): FFmpegCameraMovement {
  // Default movements that create a nice flow through the story
  const defaults: FFmpegCameraMovement[] = [
    // Section 1: Gentle zoom in to introduce the scene
    {
      effect: 'zoom-in',
      startZoom: 1.0,
      endZoom: 1.25,
      startX: 0.5,
      startY: 0.5,
      endX: 0.5,
      endY: 0.4,
      easing: 'ease-out',
    },
    // Section 2: Pan right to show exploration
    {
      effect: 'pan-right',
      startZoom: 1.15,
      endZoom: 1.15,
      startX: 0.3,
      startY: 0.5,
      endX: 0.7,
      endY: 0.5,
      easing: 'linear',
    },
    // Section 3: Zoom in for climax excitement
    {
      effect: 'zoom-in',
      startZoom: 1.0,
      endZoom: 1.35,
      startX: 0.5,
      startY: 0.5,
      endX: 0.45,
      endY: 0.35,
      easing: 'ease-in',
    },
    // Section 4: Gentle zoom out for peaceful ending
    {
      effect: 'zoom-out',
      startZoom: 1.3,
      endZoom: 1.0,
      startX: 0.5,
      startY: 0.45,
      endX: 0.5,
      endY: 0.5,
      easing: 'ease-out',
    },
  ];

  // Return the appropriate default (1-indexed sections)
  const index = Math.max(0, Math.min(sectionNumber - 1, defaults.length - 1));
  return defaults[index];
}

/**
 * Batch generate videos for multiple sections
 */
export async function generateKenBurnsVideosForStory(
  sections: Array<{
    sectionNumber: number;
    imageUrl: string;
    camera?: FFmpegCameraMovement;
  }>,
  options: {
    duration?: number;
    outputDir?: string;
    width?: number;
    height?: number;
  } = {}
): Promise<Array<{ sectionNumber: number; videoPath: string }>> {
  const results: Array<{ sectionNumber: number; videoPath: string }> = [];

  for (const section of sections) {
    const camera = section.camera || getDefaultCameraForSection(section.sectionNumber);

    const result = await generateKenBurnsVideo({
      imageUrl: section.imageUrl,
      duration: options.duration || 5,
      camera,
      outputDir: options.outputDir,
      width: options.width,
      height: options.height,
    });

    results.push({
      sectionNumber: section.sectionNumber,
      videoPath: result.videoPath,
    });
  }

  return results;
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}
