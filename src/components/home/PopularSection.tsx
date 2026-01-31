"use client";

import Link from "next/link";
import type { StoryForPlayer } from "@/types/player";

// Muted accent colors for list items
const THEME_COLORS: Record<string, string> = {
  adventure: "rgba(255, 107, 53, 0.3)",
  animals: "rgba(86, 171, 47, 0.3)",
  space: "rgba(102, 126, 234, 0.3)",
  ocean: "rgba(0, 210, 255, 0.3)",
  fairy: "rgba(240, 147, 251, 0.3)",
  dinosaurs: "rgba(17, 153, 142, 0.3)",
};

interface PopularSectionProps {
  stories: StoryForPlayer[];
  onStoryClick?: (story: StoryForPlayer) => void;
}

export function PopularSection({ stories, onStoryClick }: PopularSectionProps) {
  if (stories.length === 0) {
    return null;
  }

  // Generate random durations for demo (3-6 minutes)
  const getDuration = (index: number) => 3 + (index % 4);

  return (
    <section className="mb-6">
      <div className="section-header">
        <h2 className="section-title">Popular</h2>
        <Link href="/discover" className="section-link">
          View More
        </Link>
      </div>
      <div className="px-4 space-y-3">
        {stories.slice(0, 5).map((story, index) => (
          <PopularListItem
            key={story._id}
            story={story}
            duration={getDuration(index)}
            onClick={onStoryClick ? () => onStoryClick(story) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function PopularListItem({
  story,
  duration,
  onClick,
}: {
  story: StoryForPlayer;
  duration: number;
  onClick?: () => void;
}) {
  const theme = story.theme || "adventure";
  const color = THEME_COLORS[theme] || THEME_COLORS.adventure;
  const title = `${story.childName}'s ${theme.charAt(0).toUpperCase() + theme.slice(1)} Story`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/5 active:scale-[0.98]"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Circular thumbnail */}
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          background: color,
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span className="text-white/80 text-xs font-semibold">
          {story.childName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
        {story.interests && (
          <p className="text-xs text-white/50 truncate">{story.interests}</p>
        )}
      </div>

      {/* Duration */}
      <span className="text-xs text-white/40 flex-shrink-0">{duration} min</span>
    </button>
  );
}
