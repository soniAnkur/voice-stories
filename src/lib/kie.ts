/**
 * Kie.ai API Wrapper
 *
 * Provides access to ElevenLabs TTS via Kie.ai's unified API
 * with 30-50% cost savings compared to direct ElevenLabs access.
 *
 * API Docs: https://docs.kie.ai
 */

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_BASE_URL = "https://api.kie.ai/api/v1";

// Maximum wait time for task completion (60 seconds)
const MAX_POLL_TIME_MS = 60000;
// Poll interval (2 seconds)
const POLL_INTERVAL_MS = 2000;

export interface KieVoiceSettings {
  stability?: number;      // 0-1, default 0.5
  similarity_boost?: number; // 0-1, default 0.75
  style?: number;          // 0-1, default 0
  speed?: number;          // 0.7-1.2, default 1.0
}

interface KieTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    recordId: string;
  };
}

interface KieTaskResult {
  code: number;
  message: string;
  data: {
    taskId: string;
    state: "pending" | "processing" | "success" | "fail";
    failCode?: string;
    failMsg?: string;
    resultJson?: {
      audio_url?: string;
      url?: string;
      output?: string;
    };
  };
}

/**
 * Check if Kie.ai is configured
 */
export function isKieConfigured(): boolean {
  return !!KIE_API_KEY;
}

/**
 * Generate speech from text using ElevenLabs via Kie.ai
 * Uses the multilingual v2 model for best quality
 *
 * @param text Text to convert to speech (max 5000 chars per request)
 * @param voiceId ElevenLabs voice ID or preset name
 * @param settings Voice settings
 * @returns Audio buffer (MP3)
 */
export async function kieTextToSpeech(
  text: string,
  voiceId: string,
  settings: KieVoiceSettings = {}
): Promise<Buffer> {
  if (!KIE_API_KEY) {
    throw new Error("KIE_API_KEY not configured");
  }

  // Create the TTS task
  const taskResponse = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "elevenlabs/text-to-speech-multilingual-v2",
      input: {
        text,
        voice: voiceId,
        stability: settings.stability ?? 0.5,
        similarity_boost: settings.similarity_boost ?? 0.75,
        style: settings.style ?? 0,
        speed: settings.speed ?? 1.0,
      },
    }),
  });

  if (!taskResponse.ok) {
    const error = await taskResponse.text();
    throw new Error(`Kie.ai TTS task creation failed: ${error}`);
  }

  const taskData: KieTaskResponse = await taskResponse.json();

  if (taskData.code !== 200) {
    throw new Error(`Kie.ai TTS failed: ${taskData.message}`);
  }

  const { taskId } = taskData.data;

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    await sleep(POLL_INTERVAL_MS);

    const statusResponse = await fetch(
      `${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      continue; // Retry on network errors
    }

    const result: KieTaskResult = await statusResponse.json();

    if (result.data.state === "success") {
      // Get the audio URL from the result
      const audioUrl =
        result.data.resultJson?.audio_url ||
        result.data.resultJson?.url ||
        result.data.resultJson?.output;

      if (!audioUrl) {
        throw new Error("Kie.ai TTS completed but no audio URL in response");
      }

      // Download the audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio from Kie.ai: ${audioResponse.status}`);
      }

      const arrayBuffer = await audioResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (result.data.state === "fail") {
      throw new Error(
        `Kie.ai TTS failed: ${result.data.failMsg || result.data.failCode || "Unknown error"}`
      );
    }

    // Still pending or processing, continue polling
  }

  throw new Error("Kie.ai TTS timed out waiting for completion");
}

/**
 * Generate speech using the turbo model (faster, for previews)
 */
export async function kieTextToSpeechTurbo(
  text: string,
  voiceId: string,
  settings: KieVoiceSettings = {}
): Promise<Buffer> {
  if (!KIE_API_KEY) {
    throw new Error("KIE_API_KEY not configured");
  }

  const taskResponse = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "elevenlabs/text-to-speech-turbo-2-5",
      input: {
        text,
        voice: voiceId,
        stability: settings.stability ?? 0.5,
        similarity_boost: settings.similarity_boost ?? 0.75,
        speed: settings.speed ?? 1.0,
      },
    }),
  });

  if (!taskResponse.ok) {
    const error = await taskResponse.text();
    throw new Error(`Kie.ai TTS turbo task creation failed: ${error}`);
  }

  const taskData: KieTaskResponse = await taskResponse.json();

  if (taskData.code !== 200) {
    throw new Error(`Kie.ai TTS turbo failed: ${taskData.message}`);
  }

  const { taskId } = taskData.data;

  // Poll for completion (turbo should be faster)
  const startTime = Date.now();
  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    await sleep(POLL_INTERVAL_MS);

    const statusResponse = await fetch(
      `${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) continue;

    const result: KieTaskResult = await statusResponse.json();

    if (result.data.state === "success") {
      const audioUrl =
        result.data.resultJson?.audio_url ||
        result.data.resultJson?.url ||
        result.data.resultJson?.output;

      if (!audioUrl) {
        throw new Error("Kie.ai TTS turbo completed but no audio URL");
      }

      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download turbo audio: ${audioResponse.status}`);
      }

      return Buffer.from(await audioResponse.arrayBuffer());
    }

    if (result.data.state === "fail") {
      throw new Error(
        `Kie.ai TTS turbo failed: ${result.data.failMsg || "Unknown error"}`
      );
    }
  }

  throw new Error("Kie.ai TTS turbo timed out");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
