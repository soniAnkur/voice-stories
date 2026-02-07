import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getEffectiveVoiceId, getDefaultVoicePreset } from "@/lib/voices";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({ email: email.toLowerCase() });
    }

    // Get the effective voice ID based on user's voice type preference
    const voiceType = user.voiceType || "cloned";
    const effectiveVoiceId = getEffectiveVoiceId(
      voiceType,
      user.elevenlabsVoiceId,
      user.presetVoiceId
    );

    // Determine if user has a configured voice (either cloned or preset)
    const hasVoice = voiceType === "preset"
      ? !!user.presetVoiceId
      : !!user.elevenlabsVoiceId;

    return NextResponse.json({
      userId: user._id.toString(),
      hasVoice,
      voiceId: effectiveVoiceId,
      voiceType,
      clonedVoiceId: user.elevenlabsVoiceId || null,
      presetVoiceId: user.presetVoiceId || null,
      defaultPresetId: getDefaultVoicePreset().id,
    });
  } catch (error) {
    console.error("Error checking voice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
