import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { generateCoverImage } from "@/lib/imageGen";
import { uploadImage } from "@/lib/blob";

// Backfill can take a while for many stories
export const maxDuration = 300;

const BATCH_SIZE = 3;

export async function POST() {
  try {
    await connectDB();

    // Find stories without cover images
    const stories = await Story.find({
      status: { $in: ["complete", "paid", "preview"] },
      $or: [
        { coverImageUrl: { $exists: false } },
        { coverImageUrl: null },
        { coverImageUrl: "" },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (stories.length === 0) {
      return NextResponse.json({
        message: "No stories need cover images",
        updated: 0,
        total: 0,
      });
    }

    console.log(`Backfilling covers for ${stories.length} stories...`);

    let updated = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < stories.length; i += BATCH_SIZE) {
      const batch = stories.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (story) => {
          const imageBuffer = await generateCoverImage(
            story.childName,
            story.childAge,
            story.interests,
            story.theme || "adventure"
          );

          if (!imageBuffer) {
            throw new Error("Image generation returned null");
          }

          const coverImageUrl = await uploadImage(
            imageBuffer,
            story._id.toString(),
            {
              childName: story.childName,
              theme: story.theme || "adventure",
            }
          );

          await Story.findByIdAndUpdate(story._id, { coverImageUrl });
          console.log(`Backfilled cover for story ${story._id}: ${coverImageUrl}`);
          return coverImageUrl;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          updated++;
        } else {
          failed++;
          console.warn("Backfill failed for a story:", result.reason);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < stories.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: `Backfill complete`,
      updated,
      failed,
      total: stories.length,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Backfill failed" },
      { status: 500 }
    );
  }
}
