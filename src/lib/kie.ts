/**
 * Kie.AI API Client
 *
 * Provides access to:
 * - Image generation (Flux Kontext)
 * - Video generation (Kling 2.1 Master with start/end frame support)
 */

const KIE_API_KEY = process.env.KIE_API_KEY!;
const BASE_URL = "https://api.kie.ai/api/v1";

// Task states from Kie.AI API
type TaskState = "waiting" | "queuing" | "generating" | "success" | "fail";

interface TaskResult {
  taskId: string;
  state: TaskState;
  resultUrls?: string[];
  failCode?: string;
  failMsg?: string;
}

interface CreateTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface GetTaskResponse {
  code: number;
  message?: string;
  msg?: string;
  data: {
    taskId: string;
    state: TaskState;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
  };
}

/**
 * Sanitize prompts to avoid content filter false positives
 * Kie.AI's filter can be triggered by innocent phrases like "covered in sticky juice"
 */
function sanitizePromptForContentFilter(prompt: string): string {
  // Phrases that can trigger false positives but are innocent in children's story context
  const replacements: [RegExp, string][] = [
    // "covered in sticky/messy [color] juice" → "splashed with [color] berry stains"
    [/covered in (sticky,?\s*)?(messy,?\s*)?(red|purple|blue|green|orange)?\s*(juice|liquid)/gi, "playfully splashed with colorful berry stains"],
    // "sticky" can be sensitive in some contexts
    [/sticky,?\s+(red|purple|blue)\s+/gi, "colorful "],
    // "uncontrollably" might trigger
    [/laughing uncontrollably/gi, "laughing joyfully"],
    // Remove any double spaces
    [/\s+/g, " "],
  ];

  let sanitized = prompt;
  for (const [pattern, replacement] of replacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized.trim();
}

/**
 * Poll for Kling video task completion
 * Uses /jobs/recordInfo endpoint
 */
async function pollVideoTaskCompletion(
  taskId: string,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 5000
): Promise<TaskResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${BASE_URL}/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`);
    }

    const data: GetTaskResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`Task status error: ${data.message || data.msg || "Unknown error"}`);
    }

    const { state, resultJson, failCode, failMsg } = data.data;
    console.log(`   Task ${taskId}: ${state}`);

    if (state === "success") {
      // Parse resultJson to get URLs
      let resultUrls: string[] = [];
      if (resultJson) {
        try {
          const parsed = JSON.parse(resultJson);
          resultUrls = parsed.resultUrls || [];
        } catch {
          console.warn("Failed to parse resultJson:", resultJson);
        }
      }
      return { taskId, state, resultUrls };
    }

    if (state === "fail") {
      return { taskId, state, failCode, failMsg };
    }

    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Task ${taskId} timed out after ${maxWaitMs}ms`);
}

// Flux Kontext response format
interface FluxKontextStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    successFlag: number; // 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
    resultImageUrl?: string; // Legacy direct field
    response?: {
      originImageUrl?: string | null;
      resultImageUrl?: string;
    };
    completeTime?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  };
}

/**
 * Poll for Flux Kontext image task completion
 * Uses /flux/kontext/record-info endpoint
 */
async function pollImageTaskCompletion(
  taskId: string,
  maxWaitMs: number = 120000,
  pollIntervalMs: number = 3000
): Promise<TaskResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${BASE_URL}/flux/kontext/record-info?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get image task status: ${response.statusText}`);
    }

    const data: FluxKontextStatusResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`Image task status error: ${data.msg || "Unknown error"}`);
    }

    const { successFlag, resultImageUrl, response: nestedResponse, errorCode, errorMessage } = data.data;
    const statusNames = ["GENERATING", "SUCCESS", "CREATE_TASK_FAILED", "GENERATE_FAILED"];
    console.log(`   Task ${taskId}: ${statusNames[successFlag] || successFlag}`);

    if (successFlag === 1) {
      // Success - URL can be in direct field or nested in response object
      const imageUrl = resultImageUrl || nestedResponse?.resultImageUrl;
      console.log(`   Image URL: ${imageUrl}`);
      return {
        taskId,
        state: "success",
        resultUrls: imageUrl ? [imageUrl] : [],
      };
    }

    if (successFlag === 2 || successFlag === 3) {
      // Failed
      return {
        taskId,
        state: "fail",
        failCode: errorCode || undefined,
        failMsg: errorMessage || undefined,
      };
    }

    // Still generating (successFlag === 0), wait and retry
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Image task ${taskId} timed out after ${maxWaitMs}ms`);
}

// ============================================================================
// IMAGE GENERATION (Flux Kontext)
// ============================================================================

interface GenerateImageOptions {
  prompt: string;
  styleReferenceUrl?: string; // Optional image to use as style reference
  aspectRatio?: "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  model?: "flux-kontext-pro" | "flux-kontext-max";
}

/**
 * Generate an image using Flux Kontext
 *
 * @param options - Image generation options
 * @returns URL of the generated image
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<string> {
  const {
    prompt: originalPrompt,
    styleReferenceUrl,
    aspectRatio = "16:9",
    model = "flux-kontext-pro",
  } = options;

  // Sanitize prompt to avoid content filter false positives
  const prompt = sanitizePromptForContentFilter(originalPrompt);

  console.log(`Generating image with Flux Kontext...`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

  // Retry logic for content filter failures
  const maxRetries = 2;
  let lastError: Error | null = null;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`   Retry ${attempt}/${maxRetries} with simplified prompt...`);
      // On retry, use a much simpler, safer prompt
      currentPrompt = simplifyPromptForRetry(currentPrompt, attempt);
      console.log(`   Simplified prompt: ${currentPrompt.substring(0, 80)}...`);
    }

    const body: Record<string, unknown> = {
      prompt: currentPrompt,
      aspectRatio,
      model,
    };

    // If style reference provided, use it as input image for editing
    if (styleReferenceUrl) {
      body.inputImage = styleReferenceUrl;
    }

    try {
      const response = await fetch(`${BASE_URL}/flux/kontext/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kie.AI image generation failed: ${error}`);
      }

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error(`Kie.AI image generation error: ${data.msg}`);
      }

      const taskId = data.data?.taskId || data.taskId;
      if (!taskId) {
        throw new Error("No taskId returned from Kie.AI");
      }

      console.log(`   Task created: ${taskId}`);

      // Poll for completion using Flux Kontext specific endpoint
      const result = await pollImageTaskCompletion(taskId, 120000, 3000); // 2 min timeout for images

      if (result.state === "fail") {
        // Check if it's a content filter error
        const isContentFilter = result.failMsg?.includes("flagged as sensitive") ||
          result.failCode === "E005";
        if (isContentFilter && attempt < maxRetries) {
          lastError = new Error(`Content filter triggered: ${result.failMsg}`);
          continue; // Retry with simplified prompt
        }
        throw new Error(`Image generation failed: ${result.failMsg || result.failCode}`);
      }

      if (!result.resultUrls || result.resultUrls.length === 0) {
        throw new Error("No image URL in result");
      }

      console.log(`   Image generated: ${result.resultUrls[0]}`);
      return result.resultUrls[0];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isContentFilter = lastError.message.includes("flagged as sensitive") ||
        lastError.message.includes("E005");
      if (!isContentFilter || attempt >= maxRetries) {
        throw lastError;
      }
      // Continue to retry
    }
  }

  throw lastError || new Error("Image generation failed after retries");
}

/**
 * Simplify a prompt for retry after content filter failure
 */
function simplifyPromptForRetry(prompt: string, retryAttempt: number): string {
  // Extract key elements
  const stylePrefix = "Children's storybook illustration, soft watercolor style, warm cozy lighting, gentle pastel colors, safe and friendly atmosphere, suitable for bedtime story.";

  if (retryAttempt === 1) {
    // First retry: remove potentially problematic details
    return prompt
      .replace(/covered in|splashed with|stained with/gi, "with traces of")
      .replace(/juice|liquid|sticky/gi, "colors")
      .replace(/laughing|giggling|uncontrollably/gi, "happy")
      .replace(/\s+/g, " ")
      .trim();
  } else {
    // Second retry: use very generic prompt
    // Try to extract character name if present
    const characterMatch = prompt.match(/(\w+),?\s+(?:a|is|the)\s+(?:cute|small|young|little)?\s*\d*-?year-?old/i);
    const character = characterMatch ? characterMatch[1] : "a child";
    return `${stylePrefix} ${character} in a peaceful, cozy scene. Warm and friendly atmosphere.`;
  }
}

// ============================================================================
// VIDEO GENERATION
// ============================================================================

type VideoModel = "kling-2.1-master" | "kling-3.0";

interface GenerateVideoOptions {
  prompt: string;
  startImageUrl: string;
  endImageUrl?: string; // Optional: for start-to-end frame transitions
  duration?: 5 | 10 | 3 | 15; // Video duration in seconds
  negativePrompt?: string;
  cfgScale?: number; // 0-1, default 0.5 (Kling 2.1 only)
  model?: VideoModel; // Default: kling-3.0 for start/end frame support
}

/**
 * Generate a video using Kling AI
 * - Kling 3.0: Supports start/end frames via image_urls array (recommended)
 * - Kling 2.1 Master: Single start frame only
 *
 * @param options - Video generation options
 * @returns URL of the generated video
 */
export async function generateVideo(
  options: GenerateVideoOptions
): Promise<string> {
  const {
    prompt,
    startImageUrl,
    endImageUrl,
    duration = 5,
    negativePrompt,
    cfgScale = 0.5,
    model = endImageUrl ? "kling-3.0" : "kling-2.1-master", // Auto-select based on end frame
  } = options;

  console.log(`Generating video with ${model}...`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Has end frame: ${!!endImageUrl}`);

  let modelId: string;
  let input: Record<string, unknown>;

  if (model === "kling-3.0") {
    // Kling 3.0 uses image_urls array for start/end frames
    // multi_shots: false for single-shot mode (allows 2 frames for start/end)
    modelId = "kling-3.0/video";
    const imageUrls = endImageUrl ? [startImageUrl, endImageUrl] : [startImageUrl];
    input = {
      prompt,
      image_urls: imageUrls,
      duration: String(duration),
      aspect_ratio: "16:9",
      mode: "std", // "std" or "pro"
      multi_shots: false, // Required: false for single-shot with start/end frames
      sound: false, // Don't generate audio (we add our own narration)
    };
  } else {
    // Kling 2.1 Master - single start frame only
    modelId = "kling/v2-1-master-image-to-video";
    input = {
      prompt,
      image_url: startImageUrl,
      duration: String(duration),
      cfg_scale: cfgScale,
    };
    if (negativePrompt) {
      input.negative_prompt = negativePrompt;
    }
  }

  const response = await fetch(`${BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      input,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kie.AI video generation failed: ${error}`);
  }

  const data: CreateTaskResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(`Kie.AI video generation error: ${data.msg}`);
  }

  const taskId = data.data.taskId;
  console.log(`   Task created: ${taskId}`);

  // Poll for completion - videos take longer (5-14 minutes)
  const result = await pollVideoTaskCompletion(taskId, 900000, 10000); // 15 min timeout, poll every 10s

  if (result.state === "fail") {
    throw new Error(`Video generation failed: ${result.failMsg || result.failCode}`);
  }

  if (!result.resultUrls || result.resultUrls.length === 0) {
    throw new Error("No video URL in result");
  }

  console.log(`   Video generated: ${result.resultUrls[0]}`);
  return result.resultUrls[0];
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Generate a story section video with start and end images
 * Creates both images and the transition video
 *
 * @param startPrompt - Prompt for the starting scene
 * @param endPrompt - Prompt for the ending scene
 * @param transitionPrompt - Prompt describing the transition motion
 * @param kidStyleReference - Optional kid's photo for style reference
 * @param duration - Video duration (5 or 10 seconds)
 */
export async function generateSectionVideo(
  startPrompt: string,
  endPrompt: string,
  transitionPrompt: string,
  kidStyleReference?: string,
  duration: 5 | 10 = 10
): Promise<{
  startImageUrl: string;
  endImageUrl: string;
  videoUrl: string;
}> {
  console.log(`\nGenerating section video...`);

  // Generate start and end images in parallel
  const [startImageUrl, endImageUrl] = await Promise.all([
    generateImage({
      prompt: startPrompt,
      styleReferenceUrl: kidStyleReference,
      aspectRatio: "16:9",
    }),
    generateImage({
      prompt: endPrompt,
      styleReferenceUrl: kidStyleReference,
      aspectRatio: "16:9",
    }),
  ]);

  // Generate video with start-to-end transition
  const videoUrl = await generateVideo({
    prompt: transitionPrompt,
    startImageUrl,
    endImageUrl,
    duration,
    negativePrompt: "blur, distortion, low quality, scary, dark, violent",
  });

  return {
    startImageUrl,
    endImageUrl,
    videoUrl,
  };
}

/**
 * Check if Kie.AI is configured
 */
export function isKieConfigured(): boolean {
  return !!process.env.KIE_API_KEY;
}
