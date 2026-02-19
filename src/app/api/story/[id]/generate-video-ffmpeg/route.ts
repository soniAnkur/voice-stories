import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story, IVideoProgress } from "@/models/Story";
import { generateImage, isKieConfigured } from "@/lib/kie";
import { uploadVideoFromPath, isR2Configured } from "@/lib/blob";
import { analyzeStoryForVideo } from "@/lib/gemini";
import {
  generateKenBurnsVideo,
  isFFmpegAvailable,
  getDefaultCameraForSection,
  FFmpegCameraMovement,
} from "@/lib/kenBurns";

// Video generation can take several minutes
export const maxDuration = 300;

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
 * POST /api/story/[id]/generate-video-ffmpeg
 *
 * Generate video using FFmpeg Ken Burns effect (FREE - no API costs for video)
 * Still uses Kie.AI for image generation (~$0.08 total)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check FFmpeg availability
    if (!(await isFFmpegAvailable())) {
      return NextResponse.json(
        { error: "FFmpeg not available on this system" },
        { status: 500 }
      );
    }

    // Check Kie.AI configuration (still needed for images)
    if (!isKieConfigured()) {
      return NextResponse.json(
        { error: "Image generation not configured (missing KIE_API_KEY)" },
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
    console.log("FFMPEG VIDEO GENERATION (Ken Burns Effect)");
    console.log("=".repeat(60));
    console.log(`Story ID: ${id}`);
    console.log(`Child: ${story.childName}, Age: ${story.childAge}`);
    console.log(`Theme: ${story.theme}`);
    console.log(`Video Duration: ${videoDuration}s per section`);
    console.log(`Cost: ~$0.08 (images only - videos are FREE)`);

    // Update story status
    story.videoStatus = "generating";
    story.videoMode = true;
    if (childImageUrl) {
      story.childImageUrl = childImageUrl;
    }
    await story.save();

    // STEP 1: AI analyzes the story
    console.log("\n" + "-".repeat(60));
    console.log("STEP 1: AI Story Analysis");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "analyzing",
      stepNumber: 1,
      totalSteps: 3,
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
    console.log(`\nSections: ${analysis.sections.length}`);

    // Build character description
    const characterDesc = `${analysis.mainCharacter.name}, ${analysis.mainCharacter.appearance}`;

    // STEP 2: Generate images for each section (only start image needed)
    console.log("\n" + "-".repeat(60));
    console.log("STEP 2: Generating images (4 total - 1 per section)");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "images",
      stepNumber: 2,
      totalSteps: 3,
      currentItem: 0,
      totalItems: analysis.sections.length,
      message: "Starting image generation...",
    });

    const imageResults: { sectionNumber: number; imageUrl: string }[] = [];

    for (const section of analysis.sections) {
      console.log(`\n--- Section ${section.sectionNumber}: ${section.title} ---`);

      // Use startScene for the image prompt (Ken Burns will animate it)
      const imagePrompt = `${IMAGE_STYLE_PREFIX} ${characterDesc}. ${section.startScene}`;

      console.log(`\n[Image ${section.sectionNumber}]`);
      console.log(`  Prompt: "${imagePrompt.substring(0, 100)}..."`);
      console.log(`  Generating...`);

      await updateProgress(id, {
        step: "images",
        stepNumber: 2,
        totalSteps: 3,
        currentItem: section.sectionNumber,
        totalItems: analysis.sections.length,
        message: `Generating image ${section.sectionNumber} of ${analysis.sections.length}: ${section.title}`,
      });

      const imageUrl = await generateImage({
        prompt: imagePrompt,
        styleReferenceUrl: story.childImageUrl,
        aspectRatio: "16:9",
      });

      console.log(`  Generated: ${imageUrl}`);
      imageResults.push({ sectionNumber: section.sectionNumber, imageUrl });
    }

    // STEP 3: Generate videos with FFmpeg Ken Burns
    console.log("\n" + "-".repeat(60));
    console.log("STEP 3: Generating videos with FFmpeg Ken Burns (FREE)");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "videos",
      stepNumber: 3,
      totalSteps: 3,
      currentItem: 0,
      totalItems: analysis.sections.length,
      message: "Starting FFmpeg video generation...",
    });

    const videoResults: { sectionNumber: number; videoUrl: string }[] = [];

    for (const section of analysis.sections) {
      const image = imageResults.find((i) => i.sectionNumber === section.sectionNumber)!;

      // Use ffmpegCamera from analysis if available, otherwise use defaults
      const camera: FFmpegCameraMovement =
        section.ffmpegCamera || getDefaultCameraForSection(section.sectionNumber);

      console.log(`\n--- Section ${section.sectionNumber}: ${section.title} ---`);
      console.log(`[Video ${section.sectionNumber}] GENERATING WITH FFMPEG`);
      console.log(`  Image: ${image.imageUrl}`);
      console.log(`  Effect: ${camera.effect}`);
      console.log(`  Duration: ${videoDuration}s`);

      await updateProgress(id, {
        step: "videos",
        stepNumber: 3,
        totalSteps: 3,
        currentItem: section.sectionNumber,
        totalItems: analysis.sections.length,
        message: `Generating video ${section.sectionNumber} of ${analysis.sections.length}: ${section.title}`,
      });

      // Generate Ken Burns video
      const result = await generateKenBurnsVideo({
        imageUrl: image.imageUrl,
        duration: videoDuration,
        camera,
      });

      console.log(`  Generated: ${result.videoPath}`);

      // Upload to R2 for permanent storage
      let videoUrl = result.videoPath;
      if (isR2Configured()) {
        console.log(`  Uploading to R2...`);
        videoUrl = await uploadVideoFromPath(
          result.videoPath,
          id,
          "section",
          section.sectionNumber,
          { childName: story.childName, theme: story.theme }
        );
        console.log(`  R2 URL: ${videoUrl}`);
      }

      videoResults.push({ sectionNumber: section.sectionNumber, videoUrl });
    }

    // STEP 4: Save results
    console.log("\n" + "-".repeat(60));
    console.log("STEP 4: Saving results to database");
    console.log("-".repeat(60));

    await updateProgress(id, {
      step: "complete",
      stepNumber: 3,
      totalSteps: 3,
      message: "Saving results...",
    });

    const resultSections = analysis.sections.map((section) => {
      const image = imageResults.find((i) => i.sectionNumber === section.sectionNumber)!;
      const video = videoResults.find((v) => v.sectionNumber === section.sectionNumber)!;

      return {
        sectionNumber: section.sectionNumber,
        title: section.title,
        text: section.text,
        cinematicDescription: section.startScene,
        startImageUrl: image.imageUrl,
        videoUrl: video.videoUrl,
        videoDurationSeconds: videoDuration,
      };
    });

    // Update story
    story.storySections = resultSections;
    story.videoStatus = "complete";
    await story.save();

    // Calculate costs (images only - videos are free!)
    const imageCost = analysis.sections.length * 0.01;
    const videoCost = 0; // FREE!
    const totalCost = imageCost;

    console.log("\n" + "=".repeat(60));
    console.log("FFMPEG VIDEO GENERATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Sections: ${resultSections.length}`);
    console.log(`Images generated: ${analysis.sections.length}`);
    console.log(`Videos generated: ${analysis.sections.length} (FFmpeg - FREE)`);
    console.log(`Estimated cost: $${totalCost.toFixed(2)} (97% savings!)`);

    return NextResponse.json({
      success: true,
      storyId: id,
      sections: resultSections,
      cost: { images: imageCost, videos: videoCost, total: totalCost },
      method: "ffmpeg-kenburns",
    });
  } catch (error) {
    console.error("\n" + "!".repeat(60));
    console.error("FFMPEG VIDEO GENERATION FAILED");
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
 * GET /api/story/[id]/generate-video-ffmpeg
 *
 * Check video generation status (same as premium route)
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
      method: "ffmpeg-kenburns",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
