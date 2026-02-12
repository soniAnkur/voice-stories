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
        {/* Album Header - Fancy */}
        <div style={{ padding: '24px 16px', position: 'relative' }}>
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
              borderRadius: '50%',
              filter: 'blur(60px)',
              opacity: 0.6,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
            {/* Album Art - Fancy */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  filter: 'blur(12px)',
                  opacity: 0.5,
                }}
              />
              <div
                style={{
                  position: 'relative',
                  width: '110px',
                  height: '110px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }}
              >
                {emoji}
              </div>
            </div>

            {/* Album Info */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.ownerEmail || "Voice Collection"}
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }}>
                {album.storyCount} {album.storyCount === 1 ? "story" : "stories"}
              </p>

              {/* Play All Button - Fancy */}
              {album.stories.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <svg
                    style={{ width: '16px', height: '16px' }}
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

        {/* Story List - Fancy */}
        <div style={{ padding: '0 16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '16px' }}>Stories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</span>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              No completed stories in this album yet
            </p>
          </div>
        )}
      </div>
    </>
  );
}
