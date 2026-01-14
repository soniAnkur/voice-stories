import express from 'express';
import { spawn } from 'child_process';

export const healthRoute = express.Router();

healthRoute.get('/', async (req, res) => {
  try {
    // Check FFmpeg version
    const ffmpegVersion = await getFFmpegVersion();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ffmpeg: {
        available: true,
        version: ffmpegVersion,
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      ffmpeg: {
        available: false,
      },
    });
  }
});

function getFFmpegVersion() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    let output = '';

    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('FFmpeg not available'));
        return;
      }
      // Extract version from first line
      const match = output.match(/ffmpeg version (\S+)/);
      resolve(match ? match[1] : 'unknown');
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg not found: ${err.message}`));
    });
  });
}
