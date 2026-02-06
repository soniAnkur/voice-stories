import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { generateProfileImage } from "@/lib/imageGen";
import { uploadProfileImage } from "@/lib/blob";
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectDB();

    // Use native MongoDB driver to bypass mongoose schema caching
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    const usersCollection = db.collection("users");

    // Find all users without a profile image
    const usersWithoutProfile = await usersCollection.find({
      $or: [
        { profileImageUrl: { $exists: false } },
        { profileImageUrl: null },
        { profileImageUrl: "" },
      ],
    }).toArray();

    console.log(`Found ${usersWithoutProfile.length} users without profile images`);

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of usersWithoutProfile) {
      try {
        console.log(`Generating profile image for: ${user.email}`);

        // Generate the profile image
        const imageBuffer = await generateProfileImage(user.email);
        if (!imageBuffer) {
          results.push({
            email: user.email,
            success: false,
            error: "Image generation failed",
          });
          continue;
        }

        // Upload to R2
        const profileImageUrl = await uploadProfileImage(imageBuffer, user.email);

        // Update user record using native driver
        const updateResult = await usersCollection.updateOne(
          { _id: user._id },
          { $set: { profileImageUrl } }
        );

        console.log(`Update result for ${user.email}:`, updateResult.modifiedCount);

        results.push({ email: user.email, success: true });
        console.log(`Profile image saved for: ${user.email} -> ${profileImageUrl}`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${user.email}:`, error);
        results.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${results.length} users`,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error("Profile backfill error:", error);
    return NextResponse.json(
      { error: "Failed to backfill profiles" },
      { status: 500 }
    );
  }
}
