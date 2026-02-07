/**
 * Kie.ai 4o Image API Wrapper
 *
 * Provides access to GPT-4o Image generation via Kie.ai's unified API
 * with 30-50% cost savings compared to direct OpenAI access.
 *
 * API Docs: https://docs.kie.ai/4o-image-api
 */

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_IMAGE_BASE_URL = "https://api.kie.ai/api/v1/gpt4o-image";

// Maximum wait time for image generation (90 seconds)
const MAX_POLL_TIME_MS = 90000;
// Poll interval (3 seconds)
const POLL_INTERVAL_MS = 3000;

export type ImageSize = "1:1" | "3:2" | "2:3";

export interface KieImageOptions {
  size?: ImageSize;
  nVariants?: 1 | 2 | 4;
  promptEnhance?: boolean;
  fallback?: boolean;
}

interface KieImageTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    recordId: string;
  };
}

interface KieImageTaskResult {
  code: number;
  message: string;
  data: {
    taskId: string;
    status: "pending" | "processing" | "completed" | "failed";
    failCode?: string;
    failMsg?: string;
    images?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    resultJson?: {
      images?: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    };
  };
}

/**
 * Check if Kie.ai Image API is configured
 */
export function isKieImageConfigured(): boolean {
  return !!KIE_API_KEY;
}

/**
 * Generate an image using Kie.ai's 4o Image API (GPT-4o)
 *
 * @param prompt Text description of the image to generate
 * @param options Image generation options
 * @returns Image buffer (PNG)
 */
export async function kieGenerateImage(
  prompt: string,
  options: KieImageOptions = {}
): Promise<Buffer | null> {
  if (!KIE_API_KEY) {
    throw new Error("KIE_API_KEY not configured");
  }

  const {
    size = "1:1",
    nVariants = 1,
    promptEnhance = false,
    fallback = true,
  } = options;

  // Create the image generation task
  const taskResponse = await fetch(`${KIE_IMAGE_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      size,
      nVariants,
      promptEnhance,
      fallback,
    }),
  });

  if (!taskResponse.ok) {
    const error = await taskResponse.text();
    throw new Error(`Kie.ai Image task creation failed: ${error}`);
  }

  const taskData: KieImageTaskResponse = await taskResponse.json();

  if (taskData.code !== 200) {
    throw new Error(`Kie.ai Image failed: ${taskData.message}`);
  }

  const { taskId } = taskData.data;

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    await sleep(POLL_INTERVAL_MS);

    const statusResponse = await fetch(
      `${KIE_IMAGE_BASE_URL}/record-info?taskId=${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      continue; // Retry on network errors
    }

    const result: KieImageTaskResult = await statusResponse.json();

    if (result.data.status === "completed") {
      // Get the image URL from the result
      const images = result.data.images || result.data.resultJson?.images;

      if (!images || images.length === 0) {
        throw new Error("Kie.ai Image completed but no images in response");
      }

      const imageUrl = images[0].url;

      // Download the image file
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from Kie.ai: ${imageResponse.status}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (result.data.status === "failed") {
      throw new Error(
        `Kie.ai Image failed: ${result.data.failMsg || result.data.failCode || "Unknown error"}`
      );
    }

    // Still pending or processing, continue polling
  }

  throw new Error("Kie.ai Image generation timed out waiting for completion");
}

/**
 * Generate a story cover image using Kie.ai
 *
 * @param childName Child's name for personalization
 * @param age Child's age
 * @param interests Child's interests
 * @param theme Story theme
 * @returns Image buffer (PNG) or null on failure
 */
export async function kieGenerateCoverImage(
  childName: string,
  age: number,
  interests: string,
  theme: string
): Promise<Buffer | null> {
  const prompt = `Create a magical, child-friendly storybook cover illustration for a bedtime story.
The story features a ${age}-year-old child named ${childName} who loves ${interests}.
The theme is "${theme}".
Style: Warm, dreamy, whimsical children's book illustration with soft colors and a cozy nighttime atmosphere.
The image should be inviting for bedtime, with stars, moonlight, or magical elements.
No text or words in the image.`;

  try {
    return await kieGenerateImage(prompt, {
      size: "1:1",
      nVariants: 1,
      promptEnhance: true,
    });
  } catch (error) {
    console.error("Kie.ai cover image generation failed:", error);
    return null;
  }
}

/**
 * Generate a profile avatar using Kie.ai
 *
 * @param email User's email for style determinism
 * @returns Image buffer (PNG) or null on failure
 */
export async function kieGenerateProfileImage(
  email: string
): Promise<Buffer | null> {
  // Use email hash to select a consistent style
  const crypto = await import("crypto");
  const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
  const styleIndex = parseInt(hash.substring(0, 8), 16) % 8;

  const styles = [
    "friendly owl wearing a nightcap",
    "sleepy bunny in pajamas",
    "magical star with a gentle smile",
    "cozy teddy bear with a blanket",
    "dreamy moon character",
    "friendly cloud with sparkles",
    "cute unicorn with stars",
    "gentle dragon reading a book",
  ];

  const prompt = `Create a cute, friendly avatar icon featuring a ${styles[styleIndex]}.
Style: Soft, child-friendly illustration with warm pastel colors.
The character should look sleepy and cozy, perfect for a bedtime stories app.
Simple background with subtle magical elements.
Circular composition suitable for a profile picture.
No text.`;

  try {
    return await kieGenerateImage(prompt, {
      size: "1:1",
      nVariants: 1,
      promptEnhance: false,
    });
  } catch (error) {
    console.error("Kie.ai profile image generation failed:", error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
