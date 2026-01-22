/**
 * Suno AI Music Generation Client (via Kie.ai API)
 *
 * Generates custom background music for stories using Suno AI.
 * Based on the raga_radio implementation.
 */

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_BASE_URL = process.env.SUNO_API_BASE_URL || "https://api.kie.ai";
const SUNO_MODEL = process.env.SUNO_MODEL || "V4_5PLUS";

// Polling configuration
const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 30; // 150 seconds max wait

export interface SunoGenerateOptions {
  prompt: string;
  style: string;
  title: string;
  instrumental?: boolean;
  model?: string;
}

export interface SunoTrack {
  audioUrl: string;
  duration?: number;
  id?: string;
}

export interface SunoGenerationResult {
  taskId: string;
  status: "pending" | "success" | "failed";
  tracks?: SunoTrack[];
  error?: string;
}

/**
 * Check if Suno API is configured
 */
export function isSunoConfigured(): boolean {
  return !!SUNO_API_KEY;
}

/**
 * Make an authenticated API request to Kie.ai
 */
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!SUNO_API_KEY) {
    throw new Error("SUNO_API_KEY not configured");
  }

  const url = `${SUNO_API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Authorization": `Bearer ${SUNO_API_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.code !== 200) {
    throw new Error(data.msg || `Suno API error: ${response.status}`);
  }

  return data;
}

/**
 * Submit a music generation request to Suno
 */
export async function generateMusic(options: SunoGenerateOptions): Promise<string> {
  console.log(`[Suno] Submitting music generation request: "${options.title}"`);

  const payload = {
    prompt: options.prompt,
    style: options.style,
    title: options.title,
    customMode: true,
    instrumental: options.instrumental ?? true,
    model: options.model || SUNO_MODEL,
    callBackUrl: "https://example.com/callback", // Required by API, we poll instead
  };

  const response = await apiRequest("/api/v1/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const taskId = response.data?.taskId;
  if (!taskId) {
    console.error("[Suno] No task ID in response:", response);
    throw new Error("No task ID returned from Suno API");
  }

  console.log(`[Suno] Task submitted successfully: ${taskId}`);
  return taskId;
}

/**
 * Poll for task completion
 */
export async function pollStatus(
  taskId: string,
  maxAttempts: number = MAX_POLL_ATTEMPTS,
  intervalMs: number = POLL_INTERVAL_MS
): Promise<SunoGenerationResult> {
  console.log(`[Suno] Polling for task completion: ${taskId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiRequest(`/api/v1/generate/record-info?taskId=${taskId}`, {
        method: "GET",
      });

      const record = response.data || {};
      const status = record.status || "unknown";

      console.log(`[Suno] Poll attempt ${attempt}/${maxAttempts}: status=${status}`);

      // kie.ai uses SUCCESS, FIRST_SUCCESS, TEXT_SUCCESS, PENDING
      // FIRST_SUCCESS means at least one track is ready (Suno generates 2 tracks)
      if (status === "complete" || status === "SUCCESS" || status === "FIRST_SUCCESS") {
        // Extract tracks from response
        const tracks = extractTracks(record);

        // Only return success if we actually have tracks
        if (tracks.length > 0) {
          return {
            taskId,
            status: "success",
            tracks,
          };
        }
        // If no tracks yet despite "success" status, keep polling
        console.log(`[Suno] Status is ${status} but no tracks yet, continuing to poll...`);
      }

      if (status === "failed" || status === "error" || status === "FAILED") {
        return {
          taskId,
          status: "failed",
          error: record.errorMessage || "Generation failed",
        };
      }
    } catch (error) {
      console.warn(`[Suno] Poll attempt ${attempt} error:`, error);
      // Continue polling on transient errors
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  // Timeout
  return {
    taskId,
    status: "failed",
    error: `Timeout after ${maxAttempts * intervalMs / 1000} seconds`,
  };
}

/**
 * Extract tracks from Suno API response
 */
function extractTracks(record: any): SunoTrack[] {
  // kie.ai uses response.sunoData array
  let tracks = record.response?.sunoData || record.tracks || record.data?.tracks || [];

  // Fallback: single audio URL
  if (tracks.length === 0) {
    const audioUrl = record.audioUrl || record.audio_url;
    if (audioUrl) {
      tracks = [{ audioUrl }];
    }
  }

  return tracks.map((track: any) => {
    // kie.ai: prefer sourceAudioUrl (direct Suno CDN), fallback to audioUrl/streamAudioUrl
    // The kie.ai proxy URLs sometimes return 403, but direct Suno CDN works reliably
    let audioUrl = track.sourceAudioUrl || track.audioUrl || track.audio_url || track.streamAudioUrl;

    // Ensure URL ends with .mp3 for proper download
    if (audioUrl && !audioUrl.includes(".mp3") && !audioUrl.includes("?")) {
      audioUrl = audioUrl + ".mp3";
    }

    return {
      audioUrl,
      duration: track.duration,
      id: track.id,
    };
  }).filter((t: SunoTrack) => t.audioUrl);
}

/**
 * Download a track as a Buffer
 */
export async function downloadTrack(audioUrl: string): Promise<Buffer> {
  console.log(`[Suno] Downloading track from: ${audioUrl.substring(0, 60)}...`);

  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download track: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate music and wait for completion
 * Returns the audio Buffer or null if generation fails
 */
export async function generateMusicAndDownload(
  options: SunoGenerateOptions,
  timeoutMs: number = 120000
): Promise<{ buffer: Buffer; url: string } | null> {
  if (!isSunoConfigured()) {
    console.warn("[Suno] API not configured, skipping music generation");
    return null;
  }

  try {
    // Calculate max attempts based on timeout
    const maxAttempts = Math.ceil(timeoutMs / POLL_INTERVAL_MS);

    // Submit generation request
    const taskId = await generateMusic(options);

    // Poll for completion
    const result = await pollStatus(taskId, maxAttempts);

    if (result.status !== "success" || !result.tracks?.length) {
      console.warn(`[Suno] Generation failed: ${result.error || "No tracks"}`);
      return null;
    }

    // Download the first track
    const track = result.tracks[0];
    const buffer = await downloadTrack(track.audioUrl);

    console.log(`[Suno] Successfully generated and downloaded music (${buffer.length} bytes)`);

    return {
      buffer,
      url: track.audioUrl,
    };
  } catch (error) {
    console.error("[Suno] Music generation error:", error);
    return null;
  }
}
