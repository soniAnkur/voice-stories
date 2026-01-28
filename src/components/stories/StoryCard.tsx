"use client";

import Link from "next/link";
import { THEME_EMOJIS } from "@/types/player";

// Theme gradient CSS values for dark theme
const THEME_GRADIENT_CSS: Record<string, string> = {
  adventure: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
  animals: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
  space: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  ocean: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
  fairy: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  dinosaurs: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
};

interface StoryCardProps {
  story: {
    _id: string;
    childName: string;
    theme?: string;
    interests?: string;
    coverImageUrl?: string;
    status?: string;
  };
  size?: "small" | "medium" | "large";
  showDuration?: boolean;
  duration?: number; // in minutes
  showCheckmark?: boolean;
  onClick?: () => void;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function StoryCard({
  story,
  size = "medium",
  showDuration = false,
  duration,
  showCheckmark = false,
  onClick,
}: StoryCardProps) {
  const theme = story.theme || "adventure";
  const emoji = THEME_EMOJIS[theme] || "📖";
  const gradient = THEME_GRADIENT_CSS[theme] || THEME_GRADIENT_CSS.adventure;

  // Generate a title based on child name and theme
  const title = `${story.childName}'s ${theme.charAt(0).toUpperCase() + theme.slice(1)} Story`;

  const CardContent = (
    <>
      {/* Image Container */}
      <div className="story-card-image-container">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={title}
            className="story-card-image"
            loading="lazy"
          />
        ) : (
          <div
            className="story-card-gradient"
            style={{ background: gradient }}
          >
            <span className="story-card-emoji">{emoji}</span>
          </div>
        )}

        {/* Duration Badge */}
        {showDuration && duration && (
          <span className="duration-badge">{formatDuration(duration)}</span>
        )}

        {/* Checkmark Badge */}
        {showCheckmark && (
          <div className="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Title Overlay */}
        <div className="story-card-overlay">
          <h3 className="story-card-title">{title}</h3>
          {story.interests && (
            <p className="story-card-subtitle">{story.interests.split(",")[0]}</p>
          )}
        </div>
      </div>
    </>
  );

  const className = `story-card story-card-${size}`;

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {CardContent}
      </button>
    );
  }

  return (
    <Link href={`/story/${story._id}`} className={className}>
      {CardContent}
    </Link>
  );
}

// Smaller variant for horizontal scroll
export function StoryCardSmall({
  story,
  duration,
  onClick,
}: {
  story: StoryCardProps["story"];
  duration?: number;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      story={story}
      size="small"
      showDuration={!!duration}
      duration={duration}
      onClick={onClick}
    />
  );
}

// Featured card for 2x2 grid
export function StoryCardFeatured({
  story,
  showCheckmark = false,
  onClick,
}: {
  story: StoryCardProps["story"];
  showCheckmark?: boolean;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      story={story}
      size="medium"
      showCheckmark={showCheckmark}
      onClick={onClick}
    />
  );
}
