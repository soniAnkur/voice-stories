import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { getBackgroundMusic } from "@/lib/music";
import { mixNarrationWithMusic, simpleMix, isFFmpegAvailable } from "@/lib/audioMixer";
import { uploadAudio } from "@/lib/blob";

export async function POST(request: Request) {
  try {
    const { storyId, musicVolume = 0.15, enableDucking = true } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId required" },
        { status: 400 }
      );
    }

    // Check FFmpeg availability
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        { error: "FFmpeg not available on server" },
        { status: 500 }
      );
    }

    await connectDB();

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (!story.fullAudioUrl) {
      return NextResponse.json(
        { error: "Story audio not generated yet" },
        { status: 400 }
      );
    }

    // Get background music based on theme and prompt
    const { url: musicUrl, source: musicSource } = await getBackgroundMusic(
      story.theme || "adventure",
      story.backgroundMusicPrompt,
      300 // 5 minutes
    );

    // Download narration audio
    const narrationResponse = await fetch(
      story.fullAudioUrl.startsWith("/")
        ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${story.fullAudioUrl}`
        : story.fullAudioUrl
    );

    if (!narrationResponse.ok) {
      throw new Error("Failed to fetch narration audio");
    }

    const narrationBuffer = Buffer.from(await narrationResponse.arrayBuffer());

    // Mix audio
    let mixedBuffer: Buffer;

    if (enableDucking) {
      const result = await mixNarrationWithMusic({
        narrationBuffer,
        musicUrl,
        musicVolume,
        ducking: true,
        duckingAmount: 0.5,
        fadeInDuration: 2,
        fadeOutDuration: 3,
      });
      mixedBuffer = result.buffer;
    } else {
      mixedBuffer = await simpleMix(narrationBuffer, musicUrl, musicVolume);
    }

    // Upload mixed audio
    const mixedAudioUrl = await uploadAudio(mixedBuffer, storyId, "full");

    // Update story with mixed audio URL
    await Story.findByIdAndUpdate(storyId, {
      fullAudioUrl: mixedAudioUrl,
      musicSource,
      hasMusicMixed: true,
    });

    return NextResponse.json({
      success: true,
      mixedAudioUrl,
      musicSource,
    });
  } catch (error) {
    console.error("Error mixing audio:", error);
    return NextResponse.json(
      { error: "Failed to mix audio" },
      { status: 500 }
    );
  }
}
