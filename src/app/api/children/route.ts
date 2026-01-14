import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Story } from "@/models/Story";

export interface ChildInfo {
  childName: string;
  childAge: number;
  interests: string;
  storyCount: number;
  lastStoryDate: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({
        success: true,
        hasUser: false,
        children: [],
      });
    }

    // Get all stories for this user
    const stories = await Story.find({ userId: user._id }).sort({ createdAt: -1 });

    // Extract unique children with their most recent interests
    const childrenMap = new Map<string, ChildInfo>();

    for (const story of stories) {
      const key = `${story.childName.toLowerCase()}_${story.childAge}`;

      if (!childrenMap.has(key)) {
        childrenMap.set(key, {
          childName: story.childName,
          childAge: story.childAge,
          interests: story.interests,
          storyCount: 1,
          lastStoryDate: story.createdAt,
        });
      } else {
        const existing = childrenMap.get(key)!;
        existing.storyCount++;
        // Keep the most recent interests
        if (story.createdAt > existing.lastStoryDate) {
          existing.interests = story.interests;
          existing.lastStoryDate = story.createdAt;
        }
      }
    }

    const children = Array.from(childrenMap.values()).sort(
      (a, b) => b.lastStoryDate.getTime() - a.lastStoryDate.getTime()
    );

    return NextResponse.json({
      success: true,
      hasUser: true,
      userId: user._id.toString(),
      hasVoice: !!user.elevenlabsVoiceId,
      children,
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}
