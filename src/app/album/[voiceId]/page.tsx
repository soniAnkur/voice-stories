"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { StoryListItem } from "@/components/library/StoryListItem";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { StoryForPlayer } from "@/types/player";
import { THEME_EMOJIS, THEME_GRADIENTS } from "@/types/player";

interface AlbumData {
  voiceId: string;
  ownerEmail: string | null;
  storyCount: number;
  stories: StoryForPlayer[];
}

export default function AlbumPage({
  params,
}: {
  params: Promise<{ voiceId: string }>;
}) {
  const { voiceId } = use(params);
  const router = useRouter();
  const { dispatch } = usePlayer();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await fetch(`/api/library/albums/${encodeURIComponent(voiceId)}`);
        if (!res.ok) {
          throw new Error("Failed to fetch album");
        }
        const data = await res.json();
        setAlbum(data);
      } catch (err) {
        console.error("Error fetching album:", err);
        setError("Failed to load album");
      } finally {
        setLoading(false);
      }
    }

    if (voiceId) {
      fetchAlbum();
    }
  }, [voiceId]);

  const handleBack = () => {
    router.push("/");
  };

  const handlePlayAll = () => {
    if (album && album.stories.length > 0) {
      dispatch({
        type: "PLAY_STORY",
        story: album.stories[0],
        queue: album.stories,
      });
    }
  };

  // Get the most common theme for album art
  const primaryTheme = album?.stories[0]?.theme || "adventure";
  const emoji = THEME_EMOJIS[primaryTheme] || "🌙";
  const gradient = THEME_GRADIENTS[primaryTheme] || "from-blue-400 to-blue-500";

  if (loading) {
    return (
      <>
        <Header showBack onBack={handleBack} />
        <div className="app-container">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <p className="text-secondary mt-4">Loading album...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !album) {
    return (
      <>
        <Header showBack onBack={handleBack} />
        <div className="app-container">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="text-4xl mb-4">😔</span>
            <p className="text-secondary text-center">{error || "Album not found"}</p>
            <button
              onClick={handleBack}
              className="mt-4 text-blue-500 hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showBack onBack={handleBack} />
      <div className="app-container pb-24">
        {/* Album Header */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-4">
            {/* Album Art */}
            <div
              className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              <span className="text-5xl">{emoji}</span>
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-bold mb-1 truncate">
                {album.ownerEmail || "Voice Collection"}
              </h1>
              <p className="text-secondary text-sm">
                {album.storyCount} {album.storyCount === 1 ? "story" : "stories"}
              </p>

              {/* Play All Button */}
              {album.stories.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Story List */}
        <div className="px-4">
          <h2 className="text-sm font-semibold text-secondary mb-3">Stories</h2>
          <div className="space-y-2">
            {album.stories.map((story, index) => (
              <StoryListItem
                key={story._id}
                story={story}
                index={index}
                queue={album.stories}
              />
            ))}
          </div>
        </div>

        {/* Empty State */}
        {album.stories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="text-4xl mb-4">🎵</span>
            <p className="text-secondary text-center">
              No completed stories in this album yet
            </p>
          </div>
        )}
      </div>
    </>
  );
}
