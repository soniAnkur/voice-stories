import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { User } from "@/models/User";
import type { StoryForPlayer } from "@/types/player";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  try {
    const { voiceId } = await params;

    if (!voiceId) {
      return NextResponse.json(
        { error: "Voice ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find stories with this voiceId directly
    const directStories = await Story.find({
      voiceId,
      status: "complete",
      fullAudioUrl: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Find users with this voiceId
    const usersWithVoice = await User.find({
      elevenlabsVoiceId: voiceId,
    }).lean();

    const userIds = usersWithVoice.map((u) => u._id);

    // Find stories linked to these users (that don't have their own voiceId or have null voiceId)
    const userLinkedStories = await Story.find({
      userId: { $in: userIds },
      $or: [{ voiceId: { $exists: false } }, { voiceId: null }],
      status: "complete",
      fullAudioUrl: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Combine and deduplicate stories
    const storyMap = new Map<string, any>();

    [...directStories, ...userLinkedStories].forEach((story) => {
      const id = story._id.toString();
      if (!storyMap.has(id)) {
        storyMap.set(id, story);
      }
    });

    // Convert to array and sort by date
    const allStories = Array.from(storyMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get owner email from the first user found (if any)
    const ownerEmail = usersWithVoice[0]?.email || null;

    // Transform to StoryForPlayer format
    const stories: StoryForPlayer[] = allStories.map((story) => ({
      _id: story._id.toString(),
      childName: story.childName,
      childAge: story.childAge,
      interests: story.interests,
      theme: story.theme || "adventure",
      previewUrl: story.previewUrl,
      fullAudioUrl: story.fullAudioUrl,
      status: story.status,
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
      effectiveVoiceId: voiceId,
      ownerEmail,
    }));

    return NextResponse.json({
      voiceId,
      ownerEmail,
      storyCount: stories.length,
      stories,
    });
  } catch (error) {
    console.error("Error fetching album stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch album stories" },
      { status: 500 }
    );
  }
}
