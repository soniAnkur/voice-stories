"use client";

import { StoryCardFeatured } from "@/components/stories/StoryCard";
import type { StoryForPlayer } from "@/types/player";

interface FeaturedGridProps {
  stories: StoryForPlayer[];
  onStoryClick?: (story: StoryForPlayer) => void;
}

export function FeaturedGrid({ stories, onStoryClick }: FeaturedGridProps) {
  // Take first 4 stories for the featured grid
  const featured = stories.slice(0, 4);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="featured-grid">
        {featured.map((story, index) => (
          <StoryCardFeatured
            key={story._id}
            story={story}
            showCheckmark={index === 0} // Show checkmark on first story as example
            onClick={onStoryClick ? () => onStoryClick(story) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
