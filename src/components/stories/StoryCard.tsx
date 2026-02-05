"use client";

import Link from "next/link";
import { Mountain, PawPrint, Rocket, Waves, Sparkles, TreePine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const THEME_ICONS: Record<string, LucideIcon> = {
  adventure: Mountain,
  animals: PawPrint,
  space: Rocket,
  ocean: Waves,
  fairy: Sparkles,
  dinosaurs: TreePine,
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
  duration?: number;
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
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;
  const title = `${story.childName}'s ${theme.charAt(0).toUpperCase() + theme.slice(1)} Story`;
  const iconSize = size === "large" ? 56 : size === "small" ? 32 : 40;

  const CardContent = (
    <>
      <div className={`story-card-image-container story-card-gradient-${theme}`}>
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={title}
            className="story-card-image"
            loading="lazy"
          />
        ) : (
          <div className="story-card-glass">
            <div className="story-card-pattern">
              <Icon size={iconSize} strokeWidth={1.5} />
            </div>
          </div>
        )}

        {showDuration && duration && (
          <span className="duration-badge">{formatDuration(duration)}</span>
        )}

        {showCheckmark && (
          <div className="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

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
