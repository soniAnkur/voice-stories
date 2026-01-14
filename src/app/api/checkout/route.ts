import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { storyId, userId, email } = await request.json();

    if (!storyId || !userId || !email) {
      return NextResponse.json(
        { error: "storyId, userId, and email required" },
        { status: 400 }
      );
    }

    const url = await createCheckoutSession({
      storyId,
      userId,
      customerEmail: email,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
