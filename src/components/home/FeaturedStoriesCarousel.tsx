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

// Glow colors for each theme
const THEME_GLOW_COLORS: Record<string, string> = {
  adventure: "rgba(234, 179, 8, 0.5)",
  animals: "rgba(34, 197, 94, 0.5)",
  space: "rgba(139, 92, 246, 0.5)",
  ocean: "rgba(6, 182, 212, 0.5)",
  fairy: "rgba(236, 72, 153, 0.5)",
  dinosaurs: "rgba(249, 115, 22, 0.5)",
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
      <div className="featured-carousel-fancy">
        {stories.map((story, index) => (
          <CarouselCard
            key={story._id}
            story={story}
            index={index}
            onClick={() => onStoryClick(story)}
          />
        ))}
      </div>
    </section>
  );
}

function CarouselCard({
  story,
  index,
  onClick,
}: {
  story: StoryForPlayer;
  index: number;
  onClick: () => void;
}) {
  const theme = story.theme || "adventure";
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;
  const isDemo = story._id.startsWith("demo-");
  const glowColor = THEME_GLOW_COLORS[theme] || THEME_GLOW_COLORS.adventure;

  return (
    <button
      onClick={onClick}
      className="carousel-card-fancy"
      disabled={isDemo}
      style={{
        opacity: isDemo ? 0.7 : 1,
        animationDelay: `${index * 0.1}s`,
        ["--glow-color" as string]: glowColor,
      }}
    >
      {/* Outer glow layer */}
      <div className="carousel-card-glow" />

      {/* Main card */}
      <div className={`carousel-card-inner-fancy story-card-gradient-${theme}`}>
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.childName}
            loading="lazy"
            className="carousel-card-img"
          />
        ) : (
          <div className="story-card-glass">
            <div className="story-card-pattern">
              <Icon size={40} strokeWidth={1.5} />
            </div>
          </div>
        )}

        {/* Sparkles */}
        <div className="carousel-sparkles">
          <div className="sparkle sparkle-1" />
          <div className="sparkle sparkle-2" />
        </div>

        {/* Glassmorphism overlay */}
        <div className="carousel-card-overlay-fancy">
          <div className="carousel-card-info-glass">
            <h3 className="carousel-card-title-fancy">{story.childName}</h3>
            {story.interests && (
              <p className="carousel-card-meta-fancy">{story.interests.split(",")[0]}</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
