import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

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

    return NextResponse.json({
      userId: user._id.toString(),
      hasVoice: !!user.elevenlabsVoiceId,
      voiceId: user.elevenlabsVoiceId || null,
    });
  } catch (error) {
    console.error("Error checking voice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
