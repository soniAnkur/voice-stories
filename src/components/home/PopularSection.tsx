"use client";

import Link from "next/link";
import { StoryCardSmall } from "@/components/stories/StoryCard";
import type { StoryForPlayer } from "@/types/player";

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
      <div className="horizontal-scroll">
        {stories.map((story, index) => (
          <StoryCardSmall
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
