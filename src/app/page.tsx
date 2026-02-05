"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mountain, PawPrint, Rocket, Waves, Sparkles, TreePine } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PopularSection } from "@/components/home/PopularSection";
import { CreateStoryCard } from "@/components/home/CreateStoryCard";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { StoryForPlayer } from "@/types/player";
import type { LucideIcon } from "lucide-react";

// Lucide icon mapping for each story theme
const THEME_ICONS: Record<string, LucideIcon> = {
  adventure: Mountain,
  animals: PawPrint,
  space: Rocket,
  ocean: Waves,
  fairy: Sparkles,
  dinosaurs: TreePine,
};

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

  // Featured stories (first 3 + create card)
  const featuredStories = stories.slice(0, 3);
  // Popular stories (rest)
  const popularStories = stories.slice(3);

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
            {/* Featured Stories - Hero + Row */}
            <section className="mb-8">
              <div className="section-header">
                <h2 className="section-title">Featured</h2>
              </div>
              <div className="featured-grid">
                {featuredStories.map((story, index) => (
                  <FeaturedStoryCard
                    key={story._id}
                    story={story}
                    size={index === 0 ? "large" : "medium"}
                    onClick={() => handleStoryClick(story)}
                  />
                ))}
                <CreateStoryCard onClick={handleCreateStory} />
              </div>
            </section>

            {/* Popular Section */}
            {popularStories.length > 0 && (
              <PopularSection
                stories={popularStories}
                onStoryClick={handleStoryClick}
              />
            )}

            {/* More Stories Row */}
            {stories.length > 6 && (
              <section className="mb-8">
                <div className="section-header">
                  <h2 className="section-title">More Stories</h2>
                  <Link href="/discover" className="section-link">
                    See All
                  </Link>
                </div>
                <div className="horizontal-scroll">
                  {stories.slice(6).map((story) => (
                    <SmallStoryCard
                      key={story._id}
                      story={story}
                      onClick={() => handleStoryClick(story)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Featured Story Card Component
function FeaturedStoryCard({
  story,
  size = "medium",
  onClick,
}: {
  story: StoryForPlayer;
  size?: "medium" | "large";
  onClick: () => void;
}) {
  const theme = story.theme || "adventure";
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;
  const iconSize = size === "large" ? 56 : 40;

  return (
    <button
      onClick={onClick}
      className={`story-card story-card-${size} w-full text-left`}
    >
      <div className={`story-card-image-container story-card-gradient-${theme}`}>
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.childName}
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
        <div className="story-card-overlay">
          {size === "large" && (
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
              Featured
            </span>
          )}
          <h3 className="story-card-title">{story.childName}</h3>
          {story.interests && (
            <p className="story-card-subtitle">{story.interests.split(",")[0]}</p>
          )}
        </div>
      </div>
    </button>
  );
}

// Small Story Card for horizontal scroll
function SmallStoryCard({
  story,
  onClick,
}: {
  story: StoryForPlayer;
  onClick: () => void;
}) {
  const theme = story.theme || "adventure";
  const Icon = THEME_ICONS[theme] || THEME_ICONS.adventure;

  return (
    <button
      onClick={onClick}
      className="story-card story-card-small text-left"
    >
      <div className={`story-card-image-container story-card-gradient-${theme}`}>
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.childName}
            className="story-card-image"
            loading="lazy"
          />
        ) : (
          <div className="story-card-glass">
            <div className="story-card-pattern">
              <Icon size={32} strokeWidth={1.5} />
            </div>
          </div>
        )}
        <div className="story-card-overlay">
          <h3 className="story-card-title">{story.childName}</h3>
        </div>
      </div>
    </button>
  );
}
