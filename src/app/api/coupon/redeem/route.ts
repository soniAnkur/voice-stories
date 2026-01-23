import { NextRequest, NextResponse } from "next/server";
import { validateCoupon, markCouponUsed } from "@/lib/coupons";
import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";

export async function POST(req: NextRequest) {
  try {
    const { code, storyId } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!storyId || typeof storyId !== "string") {
      return NextResponse.json(
        { success: false, message: "Story ID is required" },
        { status: 400 }
      );
    }

    // Validate the coupon
    const validation = validateCoupon(code);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Connect to database and update story status
    await connectDB();
    const story = await Story.findById(storyId);

    if (!story) {
      return NextResponse.json(
        { success: false, message: "Story not found" },
        { status: 404 }
      );
    }

    if (story.status !== "preview") {
      return NextResponse.json(
        { success: false, message: "Story is not in preview status" },
        { status: 400 }
      );
    }

    // Mark story as paid (via coupon)
    story.status = "paid";
    story.couponCode = code.trim().toUpperCase();
    await story.save();

    // Increment coupon usage
    markCouponUsed(code);

    // Trigger full story generation (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/story/full`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId }),
    }).catch((err) => {
      console.error("Error triggering full story generation:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Coupon redeemed! Generating your full story...",
      redirectUrl: `/story/${storyId}?success=true&coupon=true`,
    });
  } catch (error) {
    console.error("Error redeeming coupon:", error);
    return NextResponse.json(
      { success: false, message: "Error redeeming coupon" },
      { status: 500 }
    );
  }
}
