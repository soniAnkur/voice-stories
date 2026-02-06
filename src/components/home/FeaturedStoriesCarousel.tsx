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

interface FeaturedStoriesCarouselProps {
  stories: StoryForPlayer[];
  onStoryClick: (story: StoryForPlayer) => void;
}

export function FeaturedStoriesCarousel({
  stories,
  onStoryClick,
}: FeaturedStoriesCarouselProps) {
  if (stories.length === 0) return null;

  return (
    <section className="featured-carousel-section">
      <div className="section-header">
        <h2 className="section-title">Recent Stories</h2>
        <Link href="/discover" className="section-link">
          See All
        </Link>
      </div>
      <div className="featured-carousel">
        {stories.map((story) => (
          <CarouselCard
            key={story._id}
            story={story}
            onClick={() => onStoryClick(story)}
          />
        ))}
      </div>
    </section>
  );
}

function CarouselCard({
  story,
  onClick,
}: {
  story: StoryForPlayer;
  onClick: () => void;
}) {
  const theme = story.theme || "adventure";
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;
  const isDemo = story._id.startsWith("demo-");

  return (
    <button
      onClick={onClick}
      className="carousel-card"
      disabled={isDemo}
      style={{ opacity: isDemo ? 0.7 : 1 }}
    >
      <div className={`carousel-card-image story-card-gradient-${theme}`}>
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.childName}
            loading="lazy"
          />
        ) : (
          <div className="story-card-glass">
            <div className="story-card-pattern">
              <Icon size={40} strokeWidth={1.5} />
            </div>
          </div>
        )}
        <div className="carousel-card-overlay">
          <h3 className="carousel-card-title">{story.childName}</h3>
          {story.interests && (
            <p className="carousel-card-meta">{story.interests.split(",")[0]}</p>
          )}
        </div>
      </div>
    </button>
  );
}
