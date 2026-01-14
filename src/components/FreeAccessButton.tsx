"use client";

import { useState } from "react";

interface FreeAccessButtonProps {
  storyId: string;
}

export function FreeAccessButton({ storyId }: FreeAccessButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStory = async () => {
    setIsLoading(true);

    try {
      // Directly trigger full story generation (bypassing payment)
      const res = await fetch("/api/story/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, bypassPayment: true }),
      });

      if (res.ok) {
        window.location.href = `/story/${storyId}?success=true`;
      } else {
        throw new Error("Failed to generate story");
      }
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Error generating story. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGetStory}
      disabled={isLoading}
      className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Creating your story...
        </span>
      ) : (
        "Get Full Story (Free Preview)"
      )}
    </button>
  );
}
