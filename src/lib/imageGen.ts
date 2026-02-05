import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate a cover illustration for a story using Gemini 2.5 Flash Image
 * Free tier: 500 images/day, paid: ~$0.039/image
 * Returns a Buffer of the PNG image, or null on failure
 */
export async function generateCoverImage(
  childName: string,
  childAge: number,
  interests: string,
  theme: string = "adventure"
): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, skipping cover image generation");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const themeDescriptions: Record<string, string> = {
      adventure:
        "epic mountain landscapes, treasure maps, compass, campfire, starry sky",
      animals:
        "friendly forest animals, cute creatures, woodland scene, butterflies",
      space:
        "rockets, planets, stars, astronaut floating in space, nebula clouds, moon",
      ocean:
        "underwater world, colorful fish, coral reef, bubbles, sea turtle, waves",
      fairy:
        "enchanted castle, fairy wings, magic sparkles, mushroom houses, fireflies",
      dinosaurs:
        "friendly dinosaurs, prehistoric jungle, volcano, fern leaves, pterodactyl flying",
    };

    const themeDetails =
      themeDescriptions[theme] || themeDescriptions.adventure;

    const prompt = `Create a beautiful, whimsical children's book illustration for a bedtime story app.

Theme: ${theme} — featuring ${themeDetails}.
The story involves: ${interests}.
Style: Dreamy digital art illustration with soft glowing lighting, rich vibrant colors, magical night/twilight atmosphere. Think modern children's app illustrations like Headspace for Kids or Calm Kids — detailed, warm, inviting, slightly fantastical.
The art should feel premium, colorful and magical — suitable for a child aged ${childAge}.
DO NOT include any text, letters, words, or numbers in the image.
DO NOT include any human faces or recognizable people.
Square composition, centered subject matter.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    // Extract image data from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.warn("No parts in Gemini image response");
      return null;
    }

    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        console.log(
          `Generated cover image: ${(buffer.length / 1024).toFixed(0)}KB`
        );
        return buffer;
      }
    }

    console.warn("No image data found in Gemini response parts");
    return null;
  } catch (error) {
    console.error("Cover image generation failed:", error);
    return null;
  }
}
