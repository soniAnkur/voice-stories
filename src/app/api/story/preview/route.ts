import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Story } from "@/models/Story";
import { generatePreviewStory } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";
import { uploadAudio } from "@/lib/blob";
import { getBackgroundMusic } from "@/lib/music";
import { mixAudioSimple } from "@/lib/simpleAudioMixer";

// Story generation involves Gemini + ElevenLabs + storage which can take 30-60s
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { userId, voiceSampleUrl, email, childName, childAge, interests, theme, voiceId, customPrompt } =
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

    // Mix narration with background music (pure JS - no FFmpeg needed)
    let finalAudioBuffer = narrationBuffer;
    let musicSource: "library" | "mubert" | undefined;
    let hasMusicMixed = false;

    try {
      // Get background music
      const musicResult = await getBackgroundMusic(
        theme || "adventure",
        storyContent.backgroundMusicPrompt,
        60 // 1 minute for preview
      );

      // Mix narration with background music using simple JS mixer
      const mixResult = await mixAudioSimple({
        narrationBuffer: Buffer.from(narrationBuffer),
        musicUrl: musicResult.url,
        musicVolume: 0.20, // Background music volume (no ducking)
        fadeInDuration: 2,
        fadeOutDuration: 3,
      });

      finalAudioBuffer = mixResult.buffer;
      musicSource = musicResult.source;
      hasMusicMixed = true;

      console.log(`Preview: Mixed audio with ${musicSource} music (simple mixer)`);
    } catch (mixError) {
      console.warn("Preview: Music mixing failed, using narration only:", mixError);
      // Continue with narration-only audio
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
