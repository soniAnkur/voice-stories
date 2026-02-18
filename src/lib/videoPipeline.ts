/**
 * Video Pipeline - Orchestrates parallel video generation for story sections
 *
 * Flow:
 * 1. For each section, generate start+end images in parallel
 * 2. For each section, generate video from images in parallel
 * 3. Return sections with all URLs populated
 */

import { generateImage, generateVideo, isKieConfigured } from "./kie";
import { IStorySection } from "@/models/Story";

// Style prefix for all bedtime story images
const IMAGE_STYLE_PREFIX =
  "Children's storybook illustration, soft watercolor style, warm cozy lighting, gentle pastel colors, safe and friendly atmosphere, suitable for bedtime story.";

interface GenerateSectionVideosOptions {
  sections: Array<{
    sectionNumber: number;
    title: string;
    text: string;
    cinematicDescription: string;
  }>;
  childImageUrl?: string; // Optional kid's photo for style reference
  videoDuration?: 5 | 10; // Default: 5 seconds per section
  onProgress?: (message: string) => void;
}

interface GenerateSectionVideosResult {
  sections: IStorySection[];
  totalCost: {
    images: number;
    videos: number;
    total: number;
  };
}

/**
 * Generate videos for all story sections in parallel
 */
export async function generateSectionVideos(
  options: GenerateSectionVideosOptions
): Promise<GenerateSectionVideosResult> {
  const { sections, childImageUrl, videoDuration = 5, onProgress } = options;

  if (!isKieConfigured()) {
    throw new Error("Kie.AI is not configured. Set KIE_API_KEY.");
  }

  const log = onProgress || console.log;
  log(`\n=== Starting Video Generation for ${sections.length} sections ===`);

  // Step 1: Generate all images in parallel (2 per section = 8 total)
  log(`\nStep 1: Generating ${sections.length * 2} images in parallel...`);

  const imagePromises = sections.flatMap((section) => {
    const startPrompt = `${IMAGE_STYLE_PREFIX} Scene showing: ${section.cinematicDescription}. Beginning of the scene.`;
    const endPrompt = `${IMAGE_STYLE_PREFIX} Scene showing: ${section.cinematicDescription}. Transition to next moment, slight movement.`;

    return [
      generateImage({
        prompt: startPrompt,
        styleReferenceUrl: childImageUrl,
        aspectRatio: "16:9",
      }).then((url) => ({
        sectionNumber: section.sectionNumber,
        type: "start" as const,
        url,
      })),
      generateImage({
        prompt: endPrompt,
        styleReferenceUrl: childImageUrl,
        aspectRatio: "16:9",
      }).then((url) => ({
        sectionNumber: section.sectionNumber,
        type: "end" as const,
        url,
      })),
    ];
  });

  const imageResults = await Promise.all(imagePromises);
  log(`   Generated ${imageResults.length} images`);

  // Group images by section
  const imagesBySection = new Map<
    number,
    { startImageUrl?: string; endImageUrl?: string }
  >();
  for (const result of imageResults) {
    if (!imagesBySection.has(result.sectionNumber)) {
      imagesBySection.set(result.sectionNumber, {});
    }
    const sectionImages = imagesBySection.get(result.sectionNumber)!;
    if (result.type === "start") {
      sectionImages.startImageUrl = result.url;
    } else {
      sectionImages.endImageUrl = result.url;
    }
  }

  // Step 2: Generate all videos in parallel
  log(`\nStep 2: Generating ${sections.length} videos in parallel...`);

  const videoPromises = sections.map(async (section) => {
    const images = imagesBySection.get(section.sectionNumber);
    if (!images?.startImageUrl || !images?.endImageUrl) {
      throw new Error(`Missing images for section ${section.sectionNumber}`);
    }

    const transitionPrompt = `Slow gentle dreamy transition. ${section.cinematicDescription}. Peaceful bedtime atmosphere. Soft camera movement.`;

    const videoUrl = await generateVideo({
      prompt: transitionPrompt,
      startImageUrl: images.startImageUrl,
      endImageUrl: images.endImageUrl,
      duration: videoDuration,
    });

    return {
      sectionNumber: section.sectionNumber,
      videoUrl,
    };
  });

  const videoResults = await Promise.all(videoPromises);
  log(`   Generated ${videoResults.length} videos`);

  // Step 3: Combine results into final sections
  const resultSections: IStorySection[] = sections.map((section) => {
    const images = imagesBySection.get(section.sectionNumber)!;
    const video = videoResults.find(
      (v) => v.sectionNumber === section.sectionNumber
    )!;

    return {
      sectionNumber: section.sectionNumber,
      title: section.title,
      text: section.text,
      cinematicDescription: section.cinematicDescription,
      startImageUrl: images.startImageUrl,
      endImageUrl: images.endImageUrl,
      videoUrl: video.videoUrl,
      videoDurationSeconds: videoDuration,
    };
  });

  // Calculate costs (approximate)
  const imageCost = sections.length * 2 * 0.01; // ~$0.01 per image
  const videoCost =
    sections.length * (videoDuration === 5 ? 0.8 : 1.6); // Kling 3.0 pricing

  log(`\n=== Video Generation Complete ===`);
  log(`   Images: ${sections.length * 2} (~$${imageCost.toFixed(2)})`);
  log(
    `   Videos: ${sections.length} x ${videoDuration}s (~$${videoCost.toFixed(2)})`
  );
  log(`   Total: ~$${(imageCost + videoCost).toFixed(2)}`);

  return {
    sections: resultSections,
    totalCost: {
      images: imageCost,
      videos: videoCost,
      total: imageCost + videoCost,
    },
  };
}

/**
 * Generate video for a single section (for preview mode)
 */
export async function generateSingleSectionVideo(
  section: {
    sectionNumber: number;
    title: string;
    text: string;
    cinematicDescription: string;
  },
  childImageUrl?: string,
  videoDuration: 5 | 10 = 5
): Promise<IStorySection> {
  if (!isKieConfigured()) {
    throw new Error("Kie.AI is not configured. Set KIE_API_KEY.");
  }

  console.log(`\nGenerating video for section ${section.sectionNumber}: "${section.title}"`);

  // Generate start and end images
  const startPrompt = `${IMAGE_STYLE_PREFIX} Scene showing: ${section.cinematicDescription}. Beginning of the scene.`;
  const endPrompt = `${IMAGE_STYLE_PREFIX} Scene showing: ${section.cinematicDescription}. Transition to next moment, slight movement.`;

  const [startImageUrl, endImageUrl] = await Promise.all([
    generateImage({
      prompt: startPrompt,
      styleReferenceUrl: childImageUrl,
      aspectRatio: "16:9",
    }),
    generateImage({
      prompt: endPrompt,
      styleReferenceUrl: childImageUrl,
      aspectRatio: "16:9",
    }),
  ]);

  // Generate video
  const transitionPrompt = `Slow gentle dreamy transition. ${section.cinematicDescription}. Peaceful bedtime atmosphere. Soft camera movement.`;

  const videoUrl = await generateVideo({
    prompt: transitionPrompt,
    startImageUrl,
    endImageUrl,
    duration: videoDuration,
  });

  return {
    sectionNumber: section.sectionNumber,
    title: section.title,
    text: section.text,
    cinematicDescription: section.cinematicDescription,
    startImageUrl,
    endImageUrl,
    videoUrl,
    videoDurationSeconds: videoDuration,
  };
}
