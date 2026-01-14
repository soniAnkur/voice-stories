import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { uploadVoiceSample } from "@/lib/blob";
import { cloneVoice } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  try {
    const { audio, userId } = await request.json();

    if (!audio || !userId) {
      return NextResponse.json(
        { error: "Audio and userId required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Upload to Vercel Blob
    const filename = `${userId}-${Date.now()}.webm`;
    const voiceSampleUrl = await uploadVoiceSample(audioBuffer, filename);

    // Clone voice with ElevenLabs
    const voiceId = await cloneVoice(audioBuffer, `parent-${userId}`);

    // Update user with voice ID
    await User.findByIdAndUpdate(userId, {
      elevenlabsVoiceId: voiceId,
    });

    return NextResponse.json({
      voiceSampleUrl,
      voiceId,
    });
  } catch (error) {
    console.error("Error uploading voice:", error);
    return NextResponse.json(
      { error: "Failed to process voice sample" },
      { status: 500 }
    );
  }
}
