"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerProvider";

interface StoryData {
  _id: string;
  childName: string;
  childAge: number;
  interests: string;
  theme: string;
  storyText?: string;
  fullAudioUrl?: string;
  previewUrl?: string;
  status: string;
  coverImageUrl?: string;
}

const THEME_GRADIENT_CSS: Record<string, string> = {
  adventure: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
  animals: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
  space: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  ocean: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
  fairy: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  dinosaurs: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
};

const THEME_EMOJIS: Record<string, string> = {
  adventure: "🏔️",
  animals: "🦁",
  space: "🚀",
  ocean: "🐠",
  fairy: "🧚",
  dinosaurs: "🦕",
};

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const { dispatch } = usePlayer();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await fetch(`/api/story/${storyId}`);
        if (!res.ok) throw new Error("Failed to fetch story");
        const data = await res.json();
        setStory(data);

        if (data.status === "paid" || data.status === "generating") {
          setTimeout(fetchStory, 3000);
        }
      } catch (err) {
        setError("Failed to load story");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  const handlePlay = () => {
    if (!story) return;

    const audioUrl = story.fullAudioUrl || story.previewUrl;
    if (!audioUrl) return;

    dispatch({
      type: "PLAY_STORY",
      story: {
        _id: story._id,
        childName: story.childName,
        childAge: story.childAge,
        interests: story.interests,
        theme: story.theme,
        previewUrl: story.previewUrl,
        fullAudioUrl: story.fullAudioUrl,
        status: story.status as "preview" | "paid" | "generating" | "complete" | "failed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <div className="page-container-no-tabs">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4">
              <div className="relative inline-block">
                <div className="spinner mx-auto" style={{ width: 56, height: 56, borderWidth: 4 }} />
                <span className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse-soft">
                  🌙
                </span>
              </div>
            </div>
            <p className="text-secondary text-sm">Loading your story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="page-container-no-tabs">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="dark-card p-8 text-center max-w-sm">
            <div className="text-5xl mb-4">😔</div>
            <h1 className="text-xl font-bold mb-2">Story not found</h1>
            <p className="text-secondary text-sm mb-6">{error}</p>
            <Link href="/" className="text-purple-400 font-medium">
              ← Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isGenerating = story.status === "paid" || story.status === "generating";
  const isComplete = story.status === "complete";
  const isFailed = story.status === "failed";
  const theme = story.theme || "adventure";
  const gradient = THEME_GRADIENT_CSS[theme] || THEME_GRADIENT_CSS.adventure;
  const emoji = THEME_EMOJIS[theme] || "📖";

  return (
    <div className="page-container-no-tabs">
      {/* Back Button - Floating */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Hero Cover Image */}
      <div className="relative w-full aspect-[4/3] max-h-[400px]">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={`${story.childName}'s Story`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: gradient }}
          >
            <span className="text-8xl">{emoji}</span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1625] to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10">
        {/* Story Info Card */}
        <div className="dark-card p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1">
                {story.childName}&apos;s Story
              </h1>
              <div className="flex items-center gap-3 text-sm text-secondary">
                <span>5 min</span>
                <span>•</span>
                <span className="capitalize">{theme}</span>
              </div>
            </div>
            {!isGenerating && (
              <button
                onClick={toggleFavorite}
                className="w-10 h-10 flex items-center justify-center"
              >
                <svg
                  className={`w-6 h-6 ${isFavorite ? "text-red-500 fill-current" : "text-gray-400"}`}
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Generating State - Clean and focused */}
          {isGenerating && (
            <div className="text-center py-6">
              <div className="mb-4">
                <div className="relative inline-block">
                  <div className="spinner mx-auto" style={{ width: 48, height: 48, borderWidth: 3 }} />
                  <span className="absolute inset-0 flex items-center justify-center text-xl animate-pulse-soft">
                    ✨
                  </span>
                </div>
              </div>
              <p className="text-white font-medium mb-1">Creating your story...</p>
              <p className="text-secondary text-sm">This takes 1-2 minutes</p>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">😔</div>
              <p className="text-white font-medium mb-1">Something went wrong</p>
              <p className="text-secondary text-sm mb-4">Please contact support</p>
              <Link href="/create" className="text-purple-400 text-sm font-medium">
                Try creating another story →
              </Link>
            </div>
          )}

          {/* Listen Button - Only show when complete or has preview and NOT generating */}
          {!isGenerating && !isFailed && (isComplete || story.previewUrl) && (
            <button
              onClick={handlePlay}
              className="btn-purple w-full"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              Listen
            </button>
          )}
        </div>

        {/* Story Text Section - Only when complete */}
        {story.storyText && isComplete && (
          <div className="dark-card p-5 mb-4">
            <h2 className="font-semibold mb-3">Story</h2>
            <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {story.storyText}
            </p>
          </div>
        )}

        {/* Story Details - Only when complete or failed */}
        {(isComplete || isFailed) && (
          <div className="dark-card-subtle p-5 mb-4">
            <h3 className="font-semibold mb-3 text-sm">Story Details</h3>
            <div className="space-y-2 text-sm">
              <p className="flex gap-2">
                <span className="text-secondary w-20">For:</span>
                <span>{story.childName}, {story.childAge} years old</span>
              </p>
              <p className="flex gap-2">
                <span className="text-secondary w-20">Theme:</span>
                <span className="capitalize">{theme}</span>
              </p>
              <p className="flex gap-2">
                <span className="text-secondary w-20">Interests:</span>
                <span>{story.interests}</span>
              </p>
            </div>
          </div>
        )}

        {/* Download Button - Only when complete */}
        {isComplete && story.fullAudioUrl && (
          <a
            href={story.fullAudioUrl}
            download={`${story.childName}-bedtime-story.mp3`}
            className="btn-secondary w-full flex items-center justify-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Story
          </a>
        )}

        {/* Create Another - Only when complete */}
        {isComplete && (
          <div className="text-center py-8">
            <Link href="/create" className="text-purple-400 text-sm font-medium">
              Create another story →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
