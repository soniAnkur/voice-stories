"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AudioPlayer } from "@/components/AudioPlayer";

interface StoryData {
  _id: string;
  childName: string;
  childAge: number;
  interests: string;
  theme: string;
  storyText?: string;
  fullAudioUrl?: string;
  status: string;
}

function StoryHeader() {
  return (
    <header className="header-glass">
      <div className="w-full max-w-lg mx-auto px-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌙</span>
          <span className="font-semibold text-sm">Voice Bedtime Tales</span>
        </div>
      </div>
    </header>
  );
}

export default function StoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storyId = params.id as string;
  const isSuccess = searchParams.get("success") === "true";

  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <>
        <StoryHeader />
        <div className="app-container">
          <div className="step-content flex items-center justify-center">
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
      </>
    );
  }

  if (error || !story) {
    return (
      <>
        <StoryHeader />
        <div className="app-container">
          <div className="step-content flex items-center justify-center">
            <div className="glass-card p-8 text-center max-w-sm mx-4">
              <div className="text-5xl mb-4">😔</div>
              <h1 className="text-xl font-bold mb-2">Story not found</h1>
              <p className="text-secondary text-sm mb-6">{error}</p>
              <a href="/" className="text-accent font-medium">
                ← Go back home
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isGenerating = story.status === "paid" || story.status === "generating";
  const isComplete = story.status === "complete";
  const isFailed = story.status === "failed";

  return (
    <>
      <StoryHeader />

      <div className="app-container">
        <div className="step-content">
          <div className="max-w-md mx-auto w-full">
            {/* Success Message */}
            {isSuccess && (
              <div className="alert-success text-center mb-6 text-sm">
                <p className="flex items-center justify-center gap-2">
                  🎉 Payment successful! Creating your story...
                </p>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block text-5xl mb-4 animate-bounce-soft">🌙</span>
              <h1 className="text-2xl font-bold mb-2">
                {story.childName}&apos;s Story
              </h1>
              {isComplete && (
                <p className="text-success text-sm font-medium flex items-center justify-center gap-1">
                  ✓ Full story ready!
                </p>
              )}
            </div>

            {/* Generating State */}
            {isGenerating && (
              <div className="glass-card p-8 text-center mb-6">
                <div className="mb-4">
                  <div className="relative inline-block">
                    <div className="spinner mx-auto" style={{ width: 48, height: 48, borderWidth: 4 }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xl animate-pulse-soft">
                      ✨
                    </span>
                  </div>
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  Creating {story.childName}&apos;s Story
                </h2>
                <p className="text-secondary text-sm mb-4">
                  This takes 1-2 minutes...
                </p>
                <div className="space-y-2 text-xs">
                  <p className={`flex items-center justify-center gap-2 ${story.status === "paid" ? "text-success" : "text-tertiary"}`}>
                    ✓ Payment received
                  </p>
                  <p className={`flex items-center justify-center gap-2 ${story.status === "generating" ? "text-accent animate-pulse-soft" : "text-tertiary"}`}>
                    {story.status === "generating" ? "✨ Generating..." : "○ Generate story"}
                  </p>
                  <p className="text-tertiary flex items-center justify-center gap-2">
                    ○ Create audio
                  </p>
                </div>
              </div>
            )}

            {/* Failed State */}
            {isFailed && (
              <div className="alert-error text-center p-6 mb-6">
                <div className="text-4xl mb-3">😔</div>
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm">
                  We couldn&apos;t generate your story. Please contact support.
                </p>
              </div>
            )}

            {/* Complete State */}
            {isComplete && story.fullAudioUrl && (
              <>
                {/* Audio Player */}
                <div className="mb-6">
                  <AudioPlayer
                    src={story.fullAudioUrl}
                    title={`${story.childName}'s Bedtime Adventure`}
                  />
                </div>

                {/* Download Button */}
                <div className="text-center mb-6">
                  <a
                    href={story.fullAudioUrl}
                    download={`${story.childName}-bedtime-story.mp3`}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Story
                  </a>
                </div>

                {/* Story Text */}
                {story.storyText && (
                  <details className="glass-card-subtle mb-6">
                    <summary className="p-4 cursor-pointer font-semibold flex items-center gap-2 text-sm">
                      📖 Read the story text
                    </summary>
                    <div className="px-4 pb-4">
                      <p className="text-secondary text-sm whitespace-pre-wrap leading-relaxed">
                        {story.storyText}
                      </p>
                    </div>
                  </details>
                )}
              </>
            )}

            {/* Story Details */}
            <div className="glass-card-subtle p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                📚 Story Details
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex gap-2">
                  <span className="text-secondary w-16">For:</span>
                  <span>{story.childName}, {story.childAge} years old</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-secondary w-16">Theme:</span>
                  <span className="capitalize">{story.theme}</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-secondary w-16">Interests:</span>
                  <span>{story.interests}</span>
                </p>
              </div>
            </div>

            {/* Create Another */}
            <div className="text-center mt-8">
              <a href="/" className="text-accent text-sm font-medium">
                ← Create another story
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
