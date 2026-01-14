import express from 'express';
import { mixNarrationWithMusic } from '../lib/ffmpeg.js';
import { downloadFile, uploadToR2 } from '../lib/r2.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const mixRoute = express.Router();

mixRoute.post('/', async (req, res) => {
  const {
    narrationUrl,
    musicUrl,
    musicVolume = 0.25,
    ducking = true,
    duckingAmount = 0.5,
    fadeInDuration = 2,
    fadeOutDuration = 3,
    applyDreamyEffects = true,
  } = req.body;

  // Validation
  if (!narrationUrl) {
    return res.status(400).json({ error: 'narrationUrl is required' });
  }
  if (!musicUrl) {
    return res.status(400).json({ error: 'musicUrl is required' });
  }

  const jobId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `ffmpeg-job-${jobId}`);

  console.log(`[${jobId}] Starting mix job`);
  console.log(`[${jobId}] Narration: ${narrationUrl}`);
  console.log(`[${jobId}] Music: ${musicUrl}`);
  console.log(`[${jobId}] Options: volume=${musicVolume}, ducking=${ducking}, effects=${applyDreamyEffects}`);

  const startTime = Date.now();

  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    console.log(`[${jobId}] Created temp dir: ${tempDir}`);

    // Define file paths
    const narrationPath = path.join(tempDir, 'narration.mp3');
    const musicPath = path.join(tempDir, 'music.mp3');
    const outputPath = path.join(tempDir, 'mixed.mp3');

    // Download files in parallel
    console.log(`[${jobId}] Downloading files...`);
    await Promise.all([
      downloadFile(narrationUrl, narrationPath),
      downloadFile(musicUrl, musicPath),
    ]);
    console.log(`[${jobId}] Downloads complete`);

    // Process with FFmpeg
    console.log(`[${jobId}] Processing with FFmpeg...`);
    await mixNarrationWithMusic({
      narrationPath,
      musicPath,
      outputPath,
      musicVolume,
      ducking,
      duckingAmount,
      fadeInDuration,
      fadeOutDuration,
      applyDreamyEffects,
    });
    console.log(`[${jobId}] FFmpeg processing complete`);

    // Upload result to R2
    console.log(`[${jobId}] Uploading result to R2...`);
    const outputBuffer = await fs.readFile(outputPath);
    const outputKey = `voice-stories/mixed/${jobId}.mp3`;
    const mixedUrl = await uploadToR2(outputBuffer, outputKey);
    console.log(`[${jobId}] Upload complete: ${mixedUrl}`);

    const duration = Date.now() - startTime;
    console.log(`[${jobId}] Job completed in ${duration}ms`);

    res.json({
      success: true,
      jobId,
      mixedUrl,
      processingTime: duration,
    });

  } catch (error) {
    console.error(`[${jobId}] Error:`, error.message);
    res.status(500).json({
      success: false,
      jobId,
      error: error.message,
    });
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[${jobId}] Cleaned up temp dir`);
    } catch (cleanupError) {
      console.warn(`[${jobId}] Cleanup warning:`, cleanupError.message);
    }
  }
});
