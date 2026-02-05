import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Story } from "@/models/Story";
import { generatePreviewStory } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";
import { uploadAudio, uploadImage } from "@/lib/blob";
import { getBackgroundMusic } from "@/lib/music";
import { mixAudioSimple } from "@/lib/simpleAudioMixer";
import { generateCoverImage } from "@/lib/imageGen";

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

    // Generate audio and cover image in parallel
    console.log(`   Generating audio with ElevenLabs (speed: 0.7)...`);
    console.log(`   Generating cover image with Gemini...`);

    const audioPromise = (async () => {
      const narrationBuffer = await textToSpeech(
        storyContent.story,
        elevenlabsVoiceId
      );

      // Mix narration with background music (pure JS - no FFmpeg needed)
      let finalAudioBuffer = narrationBuffer;
      let musicSource: "library" | "mubert" | undefined;
      let hasMusicMixed = false;

      try {
        const musicResult = await getBackgroundMusic(
          theme || "adventure",
          storyContent.backgroundMusicPrompt,
          60 // 1 minute for preview
        );

        const mixResult = await mixAudioSimple({
          narrationBuffer: Buffer.from(narrationBuffer),
          musicUrl: musicResult.url,
          musicVolume: 0.20,
          fadeInDuration: 2,
          fadeOutDuration: 3,
        });

        finalAudioBuffer = mixResult.buffer;
        musicSource = musicResult.source;
        hasMusicMixed = true;
        console.log(`Preview: Mixed audio with ${musicSource} music (simple mixer)`);
      } catch (mixError) {
        console.warn("Preview: Music mixing failed, using narration only:", mixError);
      }

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

      return { previewUrl, musicSource, hasMusicMixed };
    })();

    const imagePromise = (async () => {
      try {
        const imageBuffer = await generateCoverImage(
          childName,
          childAge,
          interests,
          theme || "adventure"
        );
        if (imageBuffer) {
          const coverImageUrl = await uploadImage(
            imageBuffer,
            story._id.toString(),
            { childName, theme: theme || "adventure" }
          );
          console.log(`   Cover image uploaded: ${coverImageUrl}`);
          return coverImageUrl;
        }
        return null;
      } catch (err) {
        console.warn("Cover image generation failed:", err);
        return null;
      }
    })();

    // Wait for both - image failure doesn't block audio
    const [audioResult, coverImageUrl] = await Promise.all([
      audioPromise,
      imagePromise,
    ]);

    const { previewUrl, musicSource, hasMusicMixed } = audioResult;

    // Update story with preview data
    const updateData: Record<string, unknown> = {
      previewText: storyContent.story,
      previewUrl,
      backgroundMusicPrompt: storyContent.backgroundMusicPrompt,
      musicSource,
      hasMusicMixed,
    };
    if (coverImageUrl) {
      updateData.coverImageUrl = coverImageUrl;
    }
    await Story.findByIdAndUpdate(story._id, updateData);

    return NextResponse.json({
      storyId: story._id.toString(),
      title: storyContent.title,
      previewUrl,
      coverImageUrl: coverImageUrl || null,
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
