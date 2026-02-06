"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedStoriesCarousel } from "@/components/home/FeaturedStoriesCarousel";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { StoryForPlayer } from "@/types/player";

// Demo stories for showcasing the UI when no real stories exist
const DEMO_STORIES: StoryForPlayer[] = [
  {
    _id: "demo-1",
    childName: "The Young Samurai",
    childAge: 7,
    interests: "Wind, Adventure",
    theme: "adventure",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-2",
    childName: "Storm Over the Sky",
    childAge: 6,
    interests: "Sky, Fortress",
    theme: "space",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-3",
    childName: "Knight's Sky",
    childAge: 5,
    interests: "Knights, Showdown",
    theme: "adventure",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-4",
    childName: "Voyage of the Celestial",
    childAge: 8,
    interests: "Celestial, Skiff",
    theme: "ocean",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-5",
    childName: "The Titan's Awakening",
    childAge: 9,
    interests: "Titans, Robots",
    theme: "dinosaurs",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-6",
    childName: "Emma",
    childAge: 5,
    interests: "Magic, Unicorns",
    theme: "fairy",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-7",
    childName: "Ocean Explorer",
    childAge: 6,
    interests: "Fish, Diving",
    theme: "ocean",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-8",
    childName: "Safari Adventure",
    childAge: 4,
    interests: "Lions, Safari",
    theme: "animals",
    status: "complete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function Home() {
  const [stories, setStories] = useState<StoryForPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories/recent");
      if (res.ok) {
        const data = await res.json();
        if (data.stories && data.stories.length > 0) {
          setStories(data.stories);
        } else {
          setStories(DEMO_STORIES);
        }
      } else {
        setStories(DEMO_STORIES);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories(DEMO_STORIES);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (story: StoryForPlayer) => {
    if (story._id.startsWith("demo-")) {
      return;
    }
    dispatch({ type: "PLAY_STORY", story, queue: stories });
  };

  const handleCreateStory = () => {
    router.push("/create");
  };

  // Hero story (first one)
  const heroStory = stories[0];
  // Carousel stories (next 3)
  const carouselStories = stories.slice(1, 4);

  return (
    <div className="page-container">
      <HomeHeader />

      <main className={state.isMiniVisible ? "content-with-player" : ""}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>
            {/* Full-screen Hero Section */}
            <HeroSection
              featuredStory={heroStory}
              onCreateStory={handleCreateStory}
            />

            {/* Recent Stories Carousel */}
            <FeaturedStoriesCarousel
              stories={carouselStories}
              onStoryClick={handleStoryClick}
            />
          </>
        )}
      </main>
    </div>
  );
}
