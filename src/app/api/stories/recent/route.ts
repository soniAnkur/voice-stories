import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";

export async function GET() {
  try {
    await connectDB();

    // Fetch recent completed stories
    const stories = await Story.find({
      status: { $in: ["complete", "paid"] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Transform to StoryForPlayer format
    const storiesForPlayer = stories.map((story) => ({
      _id: story._id.toString(),
      childName: story.childName,
      childAge: story.childAge,
      interests: story.interests,
      theme: story.theme || "adventure",
      previewUrl: story.previewUrl,
      fullAudioUrl: story.fullAudioUrl,
      status: story.status,
      createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: story.updatedAt?.toISOString() || new Date().toISOString(),
      effectiveVoiceId: story.voiceId,
    }));

    return NextResponse.json({ stories: storiesForPlayer });
  } catch (error) {
    console.error("Error fetching recent stories:", error);
    return NextResponse.json({ stories: [] });
  }
}
