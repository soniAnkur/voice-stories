import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { cloneVoice } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  try {
    const { voiceSampleUrl, userId } = await request.json();

    if (!voiceSampleUrl || !userId) {
      return NextResponse.json(
        { error: "voiceSampleUrl and userId required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the audio from URL
    const audioResponse = await fetch(voiceSampleUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    // Clone voice with ElevenLabs
    const voiceId = await cloneVoice(audioBuffer, `parent-${userId}`);

    // Update user with voice ID
    await User.findByIdAndUpdate(userId, {
      elevenlabsVoiceId: voiceId,
    });

    return NextResponse.json({ voiceId });
  } catch (error) {
    console.error("Error cloning voice:", error);
    return NextResponse.json(
      { error: "Failed to clone voice" },
      { status: 500 }
    );
  }
}
