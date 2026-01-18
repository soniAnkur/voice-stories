import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Story } from "@/models/Story";
import { generateFullStory } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";
import { uploadAudio } from "@/lib/blob";
import { Features } from "@/lib/features";
import { getBackgroundMusic } from "@/lib/music";
import { mixNarrationWithMusic, isFFmpegAvailable } from "@/lib/audioMixer";

// Full story generation with 10-min audio can take several minutes
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { storyId, bypassPayment } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get story and user
    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check payment status (unless bypassed via feature flag)
    const canBypass = Features.BYPASS_PAYMENT && bypassPayment;
    if (!canBypass && story.status !== "paid") {
      return NextResponse.json(
        { error: "Story not paid for" },
        { status: 400 }
      );
    }

    // Determine voice ID: use stored voiceId or look up from user
    let elevenlabsVoiceId = story.voiceId;
    if (!elevenlabsVoiceId && story.userId) {
      const user = await User.findById(story.userId);
      elevenlabsVoiceId = user?.elevenlabsVoiceId;
    }

    if (!elevenlabsVoiceId) {
      return NextResponse.json(
        { error: "Voice not found" },
        { status: 400 }
      );
    }

    // Update status to generating
    await Story.findByIdAndUpdate(storyId, { status: "generating" });

    try {
      // Generate full story with LLM
      console.log(`\n🌙 Generating FULL 10-minute story for ${story.childName} (age ${story.childAge})`);
      console.log(`   Theme: ${story.theme || "adventure"}, Voice ID: ${elevenlabsVoiceId}`);

      const storyContent = await generateFullStory(
        story.childName,
        story.childAge,
        story.interests,
        story.theme || "adventure",
        story.customPrompt
      );

      console.log(`   Story title: "${storyContent.title}"`);
      console.log(`   Story length: ${storyContent.story.length} chars (~${Math.round(storyContent.story.split(' ').length)} words)`);

      // Generate audio with ElevenLabs (speed: 0.7 = slowest)
      console.log(`   Generating audio with ElevenLabs (speed: 0.7)...`);
      const narrationBuffer = await textToSpeech(
        storyContent.story,
        elevenlabsVoiceId
      );

      // Try to mix with background music (local FFmpeg or remote API)
      let finalAudioBuffer = narrationBuffer;
      let musicSource: "library" | "mubert" | undefined;
      let hasMusicMixed = false;

      const ffmpegAvailable = await isFFmpegAvailable();
      const hasRemoteApi = !!process.env.FFMPEG_API_URL;

      if (ffmpegAvailable || hasRemoteApi) {
        try {
          // Get background music
          const musicResult = await getBackgroundMusic(
            story.theme || "adventure",
            storyContent.backgroundMusicPrompt,
            600 // 10 minutes
          );

          // Mix narration with background music
          const mixResult = await mixNarrationWithMusic({
            narrationBuffer,
            musicUrl: musicResult.url,
            musicVolume: 0.25,
            ducking: true,
            duckingAmount: 0.5,
            fadeInDuration: 2,
            fadeOutDuration: 3,
          });

          finalAudioBuffer = mixResult.buffer;
          musicSource = musicResult.source;
          hasMusicMixed = true;

          console.log(`Mixed audio with ${musicSource} music`);
        } catch (mixError) {
          console.warn("Music mixing failed, using narration only:", mixError);
          // Continue with narration-only audio
        }
      } else {
        console.warn("FFmpeg not available (no local or remote), skipping music mixing");
      }

      // Upload final audio to Vercel Blob with meaningful filename
      const fullAudioUrl = await uploadAudio(
        finalAudioBuffer,
        storyId,
        "full",
        {
          childName: story.childName,
          theme: story.theme || "adventure",
          voiceId: elevenlabsVoiceId,
        }
      );

      // Update story as complete
      await Story.findByIdAndUpdate(storyId, {
        storyText: storyContent.story,
        fullAudioUrl,
        backgroundMusicPrompt: storyContent.backgroundMusicPrompt,
        musicSource,
        hasMusicMixed,
        status: "complete",
      });

      return NextResponse.json({
        success: true,
        fullAudioUrl,
        title: storyContent.title,
        hasMusicMixed,
      });
    } catch (error) {
      // Mark as failed if generation fails
      await Story.findByIdAndUpdate(storyId, { status: "failed" });
      throw error;
    }
  } catch (error) {
    console.error("Error generating full story:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
