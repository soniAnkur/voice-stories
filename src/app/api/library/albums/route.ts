import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { User } from "@/models/User";
import type { Album } from "@/types/player";

export async function GET() {
  try {
    await connectDB();

    // Aggregation pipeline to group stories by effective voiceId
    const albums = await Story.aggregate([
      // Only include completed stories with audio
      {
        $match: {
          status: "complete",
          fullAudioUrl: { $exists: true, $ne: null },
        },
      },
      // Lookup user to get their voiceId if story.voiceId is not set
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Unwind user array (may be empty)
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Compute effective voiceId
      {
        $addFields: {
          effectiveVoiceId: {
            $ifNull: ["$voiceId", "$user.elevenlabsVoiceId"],
          },
          ownerEmail: "$user.email",
        },
      },
      // Filter out stories without an effective voiceId
      {
        $match: {
          effectiveVoiceId: { $exists: true, $ne: null },
        },
      },
      // Sort by creation date descending before grouping
      {
        $sort: { createdAt: -1 },
      },
      // Group by effective voiceId
      {
        $group: {
          _id: "$effectiveVoiceId",
          ownerEmail: { $first: "$ownerEmail" },
          storyCount: { $sum: 1 },
          latestStoryDate: { $first: "$createdAt" },
          // Get first 4 stories for cover art
          coverStories: {
            $push: {
              _id: { $toString: "$_id" },
              theme: "$theme",
              childName: "$childName",
            },
          },
        },
      },
      // Limit cover stories to 4
      {
        $addFields: {
          coverStories: { $slice: ["$coverStories", 4] },
        },
      },
      // Sort albums by latest story date
      {
        $sort: { latestStoryDate: -1 },
      },
      // Project final shape
      {
        $project: {
          _id: 0,
          voiceId: "$_id",
          ownerEmail: 1,
          storyCount: 1,
          latestStoryDate: 1,
          coverStories: 1,
        },
      },
    ]);

    return NextResponse.json({ albums: albums as Album[] });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}
