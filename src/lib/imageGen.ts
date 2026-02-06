import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Profile avatar style variations
const AVATAR_STYLES = [
  { style: "celestial guardian", colors: "deep purple and gold", elements: "stars, moons, cosmic swirls" },
  { style: "forest spirit", colors: "emerald green and bronze", elements: "leaves, vines, fireflies" },
  { style: "ocean dreamer", colors: "teal blue and silver", elements: "waves, bubbles, pearls" },
  { style: "sunset wanderer", colors: "coral orange and magenta", elements: "clouds, birds, sun rays" },
  { style: "aurora keeper", colors: "cyan and lavender", elements: "northern lights, snowflakes, crystals" },
  { style: "garden fairy", colors: "pink and soft green", elements: "flowers, butterflies, dewdrops" },
  { style: "starlight sage", colors: "navy blue and silver", elements: "constellations, shooting stars, nebulas" },
  { style: "autumn whisperer", colors: "amber and burgundy", elements: "falling leaves, mushrooms, acorns" },
];

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

/**
 * Generate a unique profile avatar for a user based on their email
 * Uses email hash to deterministically select style for consistency
 * Returns a Buffer of the PNG image, or null on failure
 */
export async function generateProfileImage(email: string): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, skipping profile image generation");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Use email hash to consistently select a style for this user
    const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    const styleIndex = parseInt(hash.substring(0, 8), 16) % AVATAR_STYLES.length;
    const avatarStyle = AVATAR_STYLES[styleIndex];

    const prompt = `Create a beautiful, artistic abstract avatar illustration.

Style: ${avatarStyle.style}
Color palette: ${avatarStyle.colors}
Visual elements: ${avatarStyle.elements}

The image should be:
- A dreamy, magical abstract composition that could represent a person's creative spirit
- Circular composition with soft glowing edges fading to transparent/dark
- Rich, vibrant colors with beautiful gradients
- Premium, modern digital art style with soft lighting
- Ethereal and fantastical atmosphere
- NO human faces, NO eyes, NO recognizable people or body parts
- NO text, letters, words, or numbers
- Abstract, artistic, ornamental design only
- Think of it as a magical aura or spirit representation

Square canvas with the circular design centered.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.warn("No parts in Gemini profile image response");
      return null;
    }

    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        console.log(
          `Generated profile image for ${email}: ${(buffer.length / 1024).toFixed(0)}KB (style: ${avatarStyle.style})`
        );
        return buffer;
      }
    }

    console.warn("No image data found in Gemini profile response parts");
    return null;
  } catch (error) {
    console.error("Profile image generation failed:", error);
    return null;
  }
}
