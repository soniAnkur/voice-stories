import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story, IVideoProgress } from "@/models/Story";
import { generateImage, generateVideo, isKieConfigured } from "@/lib/kie";
import { uploadVideoFromUrl, isR2Configured } from "@/lib/blob";
import { analyzeStoryForVideo } from "@/lib/gemini";

// Video generation can take 15+ minutes
export const maxDuration = 900;

// Style prefix for all bedtime story images
const IMAGE_STYLE_PREFIX =
  "Children's storybook illustration, soft watercolor style, warm cozy lighting, gentle pastel colors, safe and friendly atmosphere, suitable for bedtime story.";

// Progress update helper
async function updateProgress(
  storyId: string,
  progress: Partial<IVideoProgress>
) {
  try {
    await Story.findByIdAndUpdate(storyId, {
      videoProgress: {
        ...progress,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("Failed to update progress:", e);
  }
}

/**
 * POST /api/story/[id]/generate-video
 *
 * Generate video for an existing story with detailed progress logging
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check Kie.AI configuration
    if (!isKieConfigured()) {
      return NextResponse.json(
        { error: "Video generation not configured (missing KIE_API_KEY)" },
        { status: 500 }
      );
    }

    await connectDB();

    // Find the story
    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check if story has text
    if (!story.storyText) {
      return NextResponse.json(
        { error: "Story has no text to generate video from" },
        { status: 400 }
      );
    }

    // Check if already generating
    if (story.videoStatus === "generating") {
      return NextResponse.json(
        { error: "Video is already being generated" },
        { status: 400 }
      );
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { childImageUrl, videoDuration = 5 } = body;

    console.log("\n" + "=".repeat(60));
    console.log("VIDEO GENERATION FOR EXISTING STORY");
    console.log("=".repeat(60));
    console.log(`Story ID: ${id}`);
    console.log(`Child: ${story.childName}, Age: ${story.childAge}`);
    console.log(`Theme: ${story.theme}`);
    console.log(`Video Duration: ${videoDuration}s per section`);

    // Update story status
    story.videoStatus = "generating";
    story.videoMode = true;
    if (childImageUrl) {
      story.childImageUrl = childImageUrl;
    }
    await story.save();

    // STEP 1: AI analyzes the story to extract characters, scenes, and create story-specific descriptions
    console.log("\n" + "-".repeat(60));
    console.log("STEP 1: AI Story Analysis (extracting characters and scenes)");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "analyzing",
      stepNumber: 1,
      totalSteps: 4,
      message: "Analyzing story to extract characters and scenes...",
      startedAt: new Date(),
    });

    const analysis = await analyzeStoryForVideo(
      story.storyText,
      story.childName,
      story.childAge
    );

    console.log(`\nMain Character: ${analysis.mainCharacter.name}`);
    console.log(`  Appearance: ${analysis.mainCharacter.appearance}`);
    console.log(`\nSupporting Characters:`);
    analysis.supportingCharacters.forEach((c) => {
      console.log(`  - ${c.name}: ${c.appearance}`);
    });
    console.log(`\nSetting: ${analysis.setting}`);
    console.log(`\nSections:`);
    analysis.sections.forEach((s) => {
      console.log(`\n  Section ${s.sectionNumber}: "${s.title}"`);
      console.log(`    Start: ${s.startScene.substring(0, 80)}...`);
      console.log(`    End: ${s.endScene.substring(0, 80)}...`);
      console.log(`    Camera: ${s.cameraMovement}`);
    });

    // Build character description to include in every prompt
    const characterDesc = `${analysis.mainCharacter.name}, ${analysis.mainCharacter.appearance}`;

    // STEP 2: Generate images for each section using story-specific descriptions
    console.log("\n" + "-".repeat(60));
    console.log("STEP 2: Generating images (8 total - 2 per section)");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "images",
      stepNumber: 2,
      totalSteps: 4,
      currentItem: 0,
      totalItems: analysis.sections.length * 2,
      message: "Starting image generation...",
    });

    const imageResults: { sectionNumber: number; type: "start" | "end"; url: string }[] = [];
    let imageCount = 0;

    for (const section of analysis.sections) {
      console.log(`\n--- Section ${section.sectionNumber}: ${section.title} ---`);

      // Story-specific prompts using actual scene descriptions
      const startPrompt = `${IMAGE_STYLE_PREFIX} ${characterDesc}. ${section.startScene}`;
      const endPrompt = `${IMAGE_STYLE_PREFIX} ${characterDesc}. ${section.endScene}`;

      console.log(`\n[Image ${section.sectionNumber}a] START FRAME`);
      console.log(`  Prompt: "${startPrompt}"`);
      console.log(`  Generating...`);

      imageCount++;
      await updateProgress(id, {
        step: "images",
        stepNumber: 2,
        totalSteps: 4,
        currentItem: imageCount,
        totalItems: analysis.sections.length * 2,
        message: `Generating image ${imageCount} of ${analysis.sections.length * 2}: ${section.title} (start frame)`,
      });

      const startImageUrl = await generateImage({
        prompt: startPrompt,
        styleReferenceUrl: story.childImageUrl,
        aspectRatio: "16:9",
      });
      console.log(`  Generated: ${startImageUrl}`);
      imageResults.push({ sectionNumber: section.sectionNumber, type: "start", url: startImageUrl });

      console.log(`\n[Image ${section.sectionNumber}b] END FRAME`);
      console.log(`  Prompt: "${endPrompt}"`);
      console.log(`  Generating...`);

      imageCount++;
      await updateProgress(id, {
        step: "images",
        stepNumber: 2,
        totalSteps: 4,
        currentItem: imageCount,
        totalItems: analysis.sections.length * 2,
        message: `Generating image ${imageCount} of ${analysis.sections.length * 2}: ${section.title} (end frame)`,
      });

      const endImageUrl = await generateImage({
        prompt: endPrompt,
        styleReferenceUrl: story.childImageUrl,
        aspectRatio: "16:9",
      });
      console.log(`  Generated: ${endImageUrl}`);
      imageResults.push({ sectionNumber: section.sectionNumber, type: "end", url: endImageUrl });
    }

    // Group images by section
    const imagesBySection = new Map<number, { startImageUrl?: string; endImageUrl?: string }>();
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

    // STEP 3: Generate videos for each section with story-specific motion
    console.log("\n" + "-".repeat(60));
    console.log("STEP 3: Generating videos (4 total - 1 per section)");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "videos",
      stepNumber: 3,
      totalSteps: 4,
      currentItem: 0,
      totalItems: analysis.sections.length,
      message: "Starting video generation (this takes 2-4 minutes per video)...",
    });

    const videoResults: { sectionNumber: number; videoUrl: string }[] = [];
    let videoCount = 0;

    for (const section of analysis.sections) {
      const images = imagesBySection.get(section.sectionNumber)!;

      // Story-specific video prompt including camera movement
      const videoPrompt = `${section.cameraMovement}. ${analysis.mainCharacter.name} in a peaceful bedtime story scene. Gentle dreamy transition. Warm cozy atmosphere.`;

      console.log(`\n--- Section ${section.sectionNumber}: ${section.title} ---`);
      console.log(`[Video ${section.sectionNumber}] GENERATING VIDEO`);
      console.log(`  Start frame: ${images.startImageUrl}`);
      console.log(`  End frame: ${images.endImageUrl}`);
      console.log(`  Prompt: "${videoPrompt}"`);
      console.log(`  Duration: ${videoDuration}s`);
      console.log(`  Model: Kling 3.0 (for start/end frame support)`);
      console.log(`  Generating... (this takes 2-4 minutes)`);

      videoCount++;
      await updateProgress(id, {
        step: "videos",
        stepNumber: 3,
        totalSteps: 4,
        currentItem: videoCount,
        totalItems: analysis.sections.length,
        message: `Generating video ${videoCount} of ${analysis.sections.length}: ${section.title} (2-4 min each)`,
      });

      let videoUrl = await generateVideo({
        prompt: videoPrompt,
        startImageUrl: images.startImageUrl!,
        endImageUrl: images.endImageUrl!,
        duration: videoDuration,
      });

      console.log(`  Generated: ${videoUrl}`);

      // Upload to R2 for permanent storage
      if (isR2Configured()) {
        console.log(`  Uploading to R2...`);
        await updateProgress(id, {
          step: "uploading",
          stepNumber: 3,
          totalSteps: 4,
          currentItem: videoCount,
          totalItems: analysis.sections.length,
          message: `Uploading video ${videoCount} of ${analysis.sections.length} to storage...`,
        });
        videoUrl = await uploadVideoFromUrl(
          videoUrl,
          id,
          "section",
          section.sectionNumber,
          { childName: story.childName, theme: story.theme }
        );
        console.log(`  R2 URL: ${videoUrl}`);
      }

      videoResults.push({ sectionNumber: section.sectionNumber, videoUrl });
    }

    // STEP 4: Combine results
    console.log("\n" + "-".repeat(60));
    console.log("STEP 4: Saving results to database");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "complete",
      stepNumber: 4,
      totalSteps: 4,
      message: "Saving results and finalizing video story...",
    });

    const resultSections = analysis.sections.map((section) => {
      const images = imagesBySection.get(section.sectionNumber)!;
      const video = videoResults.find((v) => v.sectionNumber === section.sectionNumber)!;

      return {
        sectionNumber: section.sectionNumber,
        title: section.title,
        text: section.text,
        cinematicDescription: `${section.startScene} → ${section.endScene}`,
        startImageUrl: images.startImageUrl,
        endImageUrl: images.endImageUrl,
        videoUrl: video.videoUrl,
        videoDurationSeconds: videoDuration,
      };
    });

    // Update story with video data
    story.storySections = resultSections;
    story.videoStatus = "complete";
    await story.save();

    // Calculate costs
    const imageCost = analysis.sections.length * 2 * 0.01;
    const videoCost = analysis.sections.length * (videoDuration === 5 ? 0.8 : 1.6);
    const totalCost = imageCost + videoCost;

    console.log("\n" + "=".repeat(60));
    console.log("VIDEO GENERATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Sections: ${resultSections.length}`);
    console.log(`Images generated: ${analysis.sections.length * 2}`);
    console.log(`Videos generated: ${analysis.sections.length}`);
    console.log(`Estimated cost: $${totalCost.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      storyId: id,
      sections: resultSections,
      cost: { images: imageCost, videos: videoCost, total: totalCost },
    });
  } catch (error) {
    console.error("\n" + "!".repeat(60));
    console.error("VIDEO GENERATION FAILED");
    console.error("!".repeat(60));
    console.error(error);

    // Try to update story status to failed
    try {
      const { id } = await params;
      await connectDB();
      await Story.findByIdAndUpdate(id, { videoStatus: "failed" });
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      {
        error: "Video generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/story/[id]/generate-video
 *
 * Check video generation status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const story = await Story.findById(id).select(
      "videoStatus videoMode storySections finalVideoUrl videoProgress"
    );

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({
      videoStatus: story.videoStatus || "none",
      videoMode: story.videoMode || false,
      sectionsCount: story.storySections?.length || 0,
      finalVideoUrl: story.finalVideoUrl,
      sections: story.storySections,
      progress: story.videoProgress || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

