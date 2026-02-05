"use client";

import Link from "next/link";
import { Mountain, PawPrint, Rocket, Waves, Sparkles, TreePine } from "lucide-react";
import type { StoryForPlayer } from "@/types/player";
import type { LucideIcon } from "lucide-react";

const THEME_ICONS: Record<string, LucideIcon> = {
  adventure: Mountain,
  animals: PawPrint,
  space: Rocket,
  ocean: Waves,
  fairy: Sparkles,
  dinosaurs: TreePine,
};

interface PopularSectionProps {
  stories: StoryForPlayer[];
  onStoryClick?: (story: StoryForPlayer) => void;
}

export function PopularSection({ stories, onStoryClick }: PopularSectionProps) {
  if (stories.length === 0) {
    return null;
  }

  const getDuration = (index: number) => 3 + (index % 4);

  return (
    <section className="mb-8">
      <div className="section-header">
        <h2 className="section-title">Popular</h2>
        <Link href="/discover" className="section-link">
          View More
        </Link>
      </div>
      <div className="horizontal-scroll">
        {stories.slice(0, 5).map((story, index) => (
          <PopularCard
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

function PopularCard({
  story,
  duration,
  onClick,
}: {
  story: StoryForPlayer;
  duration: number;
  onClick?: () => void;
}) {
  const theme = story.theme || "adventure";
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;
  const title = `${story.childName}'s Story`;

  return (
    <button onClick={onClick} className="popular-card text-left">
      <div
        className="popular-card-art"
        style={{ background: `var(--gradient-${theme})` }}
      >
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={title}
            loading="lazy"
          />
        ) : (
          <Icon size={40} strokeWidth={1.5} className="text-white/30" />
        )}
        <span className="duration-badge">{duration} min</span>
      </div>
      <div className="popular-card-info">
        <p className="popular-card-title">{title}</p>
        {story.interests && (
          <p className="popular-card-meta">{story.interests}</p>
        )}
      </div>
    </button>
  );
}
