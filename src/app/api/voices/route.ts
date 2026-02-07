import { NextResponse } from "next/server";
import { getVoicePresets, getVoicePresetById } from "@/lib/voices";

/**
 * GET /api/voices
 * Returns all available voice presets
 */
export async function GET() {
  try {
    const voices = getVoicePresets();

    return NextResponse.json({
      voices: voices.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        gender: v.gender,
        style: v.style,
        previewUrl: v.previewUrl,
        isDefault: v.isDefault,
      })),
    });
  } catch (error) {
    console.error("Error fetching voice presets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voices
 * Get a specific voice preset by ID
 */
export async function POST(request: Request) {
  try {
    const { voiceId } = await request.json();

    if (!voiceId) {
      return NextResponse.json(
        { error: "voiceId required" },
        { status: 400 }
      );
    }

    const voice = getVoicePresetById(voiceId);

    if (!voice) {
      return NextResponse.json(
        { error: "Voice preset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      voice: {
        id: voice.id,
        name: voice.name,
        description: voice.description,
        gender: voice.gender,
        style: voice.style,
        previewUrl: voice.previewUrl,
        isDefault: voice.isDefault,
      },
    });
  } catch (error) {
    console.error("Error fetching voice preset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
