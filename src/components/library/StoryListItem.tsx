"use client";

import { usePlayer } from "@/components/player/PlayerProvider";
import type { StoryForPlayer } from "@/types/player";

// Theme gradients for inline styles
const THEME_GRADIENT_STYLES: Record<string, string> = {
  adventure: "linear-gradient(135deg, #f97316, #ea580c)",
  animals: "linear-gradient(135deg, #22c55e, #16a34a)",
  space: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  ocean: "linear-gradient(135deg, #06b6d4, #0891b2)",
  fairy: "linear-gradient(135deg, #ec4899, #db2777)",
  dinosaurs: "linear-gradient(135deg, #84cc16, #65a30d)",
};

const THEME_GLOW_COLORS: Record<string, string> = {
  adventure: "rgba(249, 115, 22, 0.3)",
  animals: "rgba(34, 197, 94, 0.3)",
  space: "rgba(139, 92, 246, 0.3)",
  ocean: "rgba(6, 182, 212, 0.3)",
  fairy: "rgba(236, 72, 153, 0.3)",
  dinosaurs: "rgba(132, 204, 22, 0.3)",
};

interface StoryListItemProps {
  story: StoryForPlayer;
  index: number;
  queue: StoryForPlayer[];
}

export function StoryListItem({ story, index, queue }: StoryListItemProps) {
  const { state, dispatch } = usePlayer();

  const isCurrentStory = state.currentStory?._id === story._id;
  const isPlaying = isCurrentStory && state.isPlaying;

  const theme = story.theme || "adventure";
  const gradientStyle = THEME_GRADIENT_STYLES[theme] || THEME_GRADIENT_STYLES.adventure;
  const glowColor = THEME_GLOW_COLORS[theme] || THEME_GLOW_COLORS.adventure;

  // Format date
  const formattedDate = new Date(story.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handlePlay = () => {
    if (isCurrentStory) {
      dispatch({ type: "TOGGLE_PLAY" });
    } else {
      dispatch({ type: "PLAY_STORY", story, queue });
    }
  };

  return (
    <button
      onClick={handlePlay}
      style={{
        width: '100%',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: isCurrentStory ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: isCurrentStory ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '18px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {/* Glow effect for current story */}
      {isCurrentStory && (
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            background: glowColor,
            filter: 'blur(20px)',
            opacity: 0.5,
          }}
        />
      )}

      {/* Theme Image / Play-Pause Icon */}
      <div
        style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: gradientStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        {isPlaying ? (
          <svg style={{ width: '20px', height: '20px', color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : isCurrentStory ? (
          <svg style={{ width: '20px', height: '20px', marginLeft: '2px', color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={theme}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
      </div>

      {/* Story Info */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: isCurrentStory ? '#a78bfa' : 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {story.childName}&apos;s Story
          </p>
          {isPlaying && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
              <span style={{ width: '3px', height: '12px', background: '#a78bfa', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite' }} />
              <span style={{ width: '3px', height: '16px', background: '#a78bfa', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite 0.15s' }} />
              <span style={{ width: '3px', height: '10px', background: '#a78bfa', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite 0.3s' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'capitalize' }}>{theme}</span>
          <span style={{ width: '4px', height: '4px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>{formattedDate}</span>
        </div>
      </div>

      {/* Story number */}
      <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.3)', fontVariantNumeric: 'tabular-nums', position: 'relative' }}>{index + 1}</span>
    </button>
  );
}
