import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Story } from "@/models/Story";
import { generatePreviewStory } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";
import { uploadAudio } from "@/lib/blob";
import { getBackgroundMusicWithSuno, selectMusicTrack } from "@/lib/music";
import { mixNarrationWithMusic, isFFmpegAvailable } from "@/lib/audioMixer";

// Story generation involves Gemini + ElevenLabs + Suno + storage
// Suno music generation can take 60-120s, so we need extra time
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const { userId, voiceSampleUrl, email, childName, childAge, interests, theme, voiceId, customPrompt, musicSource: requestedMusicSource } =
      await request.json();

    if (!childName || !childAge || !interests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine the voice ID to use
    let elevenlabsVoiceId = voiceId; // Direct voice ID takes priority
    let user = null;

    // If no direct voiceId, look up user
    if (!elevenlabsVoiceId) {
      await connectDB();

      // Get or create user
      user = await User.findById(userId);
      if (!user && email) {
        user = await User.findOne({ email: email.toLowerCase() });
      }

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user has a voice ID
      if (!user.elevenlabsVoiceId) {
        return NextResponse.json(
          { error: "Voice not set up" },
          { status: 400 }
        );
      }

      elevenlabsVoiceId = user.elevenlabsVoiceId;
    } else {
      // If using direct voiceId, still connect to DB for story creation
      await connectDB();
    }

    // Create story record
    const story = await Story.create({
      userId: user?._id || null,
      voiceId: voiceId || null, // Store direct voiceId for full story generation
      childName,
      childAge,
      interests,
      theme: theme || "adventure",
      status: "preview",
      customPrompt: customPrompt || null,
      musicSource: requestedMusicSource || "suno", // Store user's music preference
    });

    // Generate preview story with LLM
    console.log(`\n🌙 Generating PREVIEW story for ${childName} (age ${childAge})`);
    console.log(`   Theme: ${theme || "adventure"}, Voice ID: ${elevenlabsVoiceId}`);

    const storyContent = await generatePreviewStory(
      childName,
      childAge,
      interests,
      theme || "adventure",
      customPrompt
    );

    console.log(`   Story title: "${storyContent.title}"`);
    console.log(`   Story length: ${storyContent.story.length} chars`);

    // Generate audio with ElevenLabs (speed: 0.7 = slowest)
    console.log(`   Generating audio with ElevenLabs (speed: 0.7)...`);
    const narrationBuffer = await textToSpeech(
      storyContent.story,
      elevenlabsVoiceId
    );

    // Try to mix with background music (local FFmpeg or remote API)
    let finalAudioBuffer = narrationBuffer;
    let musicSource: "library" | "mubert" | "suno" | undefined;
    let hasMusicMixed = false;

    const ffmpegAvailable = await isFFmpegAvailable();
    const hasRemoteApi = !!process.env.FFMPEG_API_URL;

    if (ffmpegAvailable || hasRemoteApi) {
      try {
        let musicResult: { url: string; source: "library" | "suno"; buffer?: Buffer };

        // Check if user requested library music or Suno AI generated
        if (requestedMusicSource === "library") {
          // Use curated library music (faster)
          console.log(`   Using library music (user selected)...`);
          const track = selectMusicTrack(theme || "adventure");
          musicResult = { url: track.url, source: "library" };
          console.log(`   Library track: ${track.name}`);
        } else {
          // Get background music using Suno AI (analyzes story content)
          console.log(`   Generating background music with Suno AI...`);
          musicResult = await getBackgroundMusicWithSuno(
            storyContent.story,
            theme || "adventure",
            childAge,
            60, // 1 minute for preview
            150000 // 150s timeout - Suno can take 60-120s
          );
        }

        // Mix narration with background music
        // If Suno returned a buffer, use it directly; otherwise use URL
        const mixResult = await mixNarrationWithMusic({
          narrationBuffer,
          musicUrl: musicResult.url,
          musicBuffer: musicResult.buffer,
          musicVolume: 0.25,
          ducking: true,
          duckingAmount: 0.5,
          fadeInDuration: 1,
          fadeOutDuration: 2,
        });

        finalAudioBuffer = mixResult.buffer;
        musicSource = musicResult.source;
        hasMusicMixed = true;

        console.log(`   Preview: Mixed audio with ${musicSource} music`);
      } catch (mixError) {
        console.warn("Preview: Music mixing failed, using narration only:", mixError);
        // Continue with narration-only audio
      }
    } else {
      console.warn("Preview: FFmpeg not available (no local or remote), skipping music mixing");
    }

    // Upload audio to Vercel Blob with meaningful filename
    const previewUrl = await uploadAudio(
      finalAudioBuffer,
      story._id.toString(),
      "preview",
      {
        childName,
        theme: theme || "adventure",
        voiceId: elevenlabsVoiceId,
      }
    );

    // Update story with preview data
    await Story.findByIdAndUpdate(story._id, {
      previewText: storyContent.story,
      previewUrl,
      backgroundMusicPrompt: storyContent.backgroundMusicPrompt,
      musicSource,
      hasMusicMixed,
    });

    return NextResponse.json({
      storyId: story._id.toString(),
      title: storyContent.title,
      previewUrl,
      hasMusicMixed,
    });
  } catch (error) {
    console.error("Error creating preview:", error);
    return NextResponse.json(
      { error: "Failed to create preview" },
      { status: 500 }
    );
  }
}
