import { spawn } from 'child_process';

/**
 * Mix narration with background music using FFmpeg
 * Includes volume ducking, dreamy effects, and loudness normalization
 */
export async function mixNarrationWithMusic(options) {
  const {
    narrationPath,
    musicPath,
    outputPath,
    musicVolume = 0.25,
    ducking = true,
    duckingAmount = 0.5,
    fadeInDuration = 2,
    fadeOutDuration = 3,
    applyDreamyEffects = true,
  } = options;

  // Get narration duration for music trimming
  const duration = await getAudioDuration(narrationPath);
  const fadeOutStart = Math.max(0, duration - fadeOutDuration);

  console.log(`Audio duration: ${duration.toFixed(2)}s`);

  // Build the filter complex
  const filterComplex = buildFilterComplex({
    duration,
    fadeOutStart,
    musicVolume,
    ducking,
    duckingAmount,
    fadeInDuration,
    fadeOutDuration,
    applyDreamyEffects,
  });

  const args = [
    '-i', narrationPath,
    '-i', musicPath,
    '-filter_complex', filterComplex,
    '-map', '[final]',
    '-acodec', 'libmp3lame',
    '-b:a', '192k',
    '-y', // Overwrite output
    outputPath,
  ];

  await runFFmpeg(args);
}

/**
 * Build FFmpeg filter_complex string
 */
function buildFilterComplex(options) {
  const {
    duration,
    fadeOutStart,
    musicVolume,
    ducking,
    duckingAmount,
    fadeInDuration,
    fadeOutDuration,
    applyDreamyEffects,
  } = options;

  const filters = [];

  // Voice processing
  if (applyDreamyEffects) {
    // Apply dreamy effects: lowpass filter + echo/reverb
    filters.push(
      `[0:a]lowpass=f=8000,` +
      `aecho=0.8:0.5:100|200|300:0.5|0.35|0.2,` +
      `aecho=0.8:0.4:500|700:0.3|0.2,` +
      `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`
    );
  } else {
    // Just format standardization
    filters.push(
      `[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice]`
    );
  }

  // Music processing: loop, trim, volume, fades
  filters.push(
    `[1:a]aloop=loop=-1:size=2e+09,` +
    `atrim=0:${duration}[musicloop]`
  );

  filters.push(
    `[musicloop]volume=${musicVolume},` +
    `afade=t=in:st=0:d=${fadeInDuration},` +
    `afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}[musicfaded]`
  );

  // Mixing with optional ducking
  if (ducking) {
    // Sidechain compression: music ducks when voice is present
    filters.push(
      `[musicfaded][voice]sidechaincompress=` +
      `threshold=0.02:ratio=4:attack=50:release=400:` +
      `level_sc=${duckingAmount}[musicducked]`
    );

    // Final mix with loudness normalization
    filters.push(
      `[voice][musicducked]amix=inputs=2:duration=first:dropout_transition=2,` +
      `loudnorm=I=-16:TP=-1.5:LRA=11[final]`
    );
  } else {
    // Simple mix without ducking
    filters.push(
      `[voice][musicfaded]amix=inputs=2:duration=first:dropout_transition=2,` +
      `loudnorm=I=-16:TP=-1.5:LRA=11[final]`
    );
  }

  return filters.join(';');
}

/**
 * Get audio duration using ffprobe
 */
export function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath,
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const info = JSON.parse(output);
        const duration = parseFloat(info.format.duration);
        if (isNaN(duration)) {
          reject(new Error('Could not parse audio duration'));
          return;
        }
        resolve(duration);
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });

    ffprobe.on('error', (err) => {
      reject(new Error(`ffprobe not found: ${err.message}`));
    });
  });
}

/**
 * Run FFmpeg command
 */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log('Running FFmpeg with args:', args.join(' ').substring(0, 200) + '...');

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      } else {
        resolve();
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg not found: ${err.message}`));
    });
  });
}

/**
 * Normalize audio loudness
 */
export async function normalizeAudio(inputPath, outputPath) {
  const args = [
    '-i', inputPath,
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-acodec', 'libmp3lame',
    '-b:a', '192k',
    '-y',
    outputPath,
  ];

  await runFFmpeg(args);
}
