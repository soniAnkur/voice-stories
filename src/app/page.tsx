"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PopularSection } from "@/components/home/PopularSection";
import { CreateStoryCard } from "@/components/home/CreateStoryCard";
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
          // Use demo stories if no real stories exist
          setStories(DEMO_STORIES);
        }
      } else {
        // Use demo stories on error
        setStories(DEMO_STORIES);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      // Use demo stories on error
      setStories(DEMO_STORIES);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (story: StoryForPlayer) => {
    // For demo stories, just show them (no audio)
    if (story._id.startsWith("demo-")) {
      return;
    }
    // For real stories, play them
    dispatch({ type: "PLAY_STORY", story, queue: stories });
  };

  const handleCreateStory = () => {
    router.push("/create");
  };

  // Featured stories (first 4 or 3 + create card)
  const featuredStories = stories.slice(0, 3);
  // Popular stories (rest)
  const popularStories = stories.slice(3);

  return (
    <div className="page-container">
      {/* Home Header with Unlock Button */}
      <HomeHeader />

      {/* Main Content */}
      <main className={state.isMiniVisible ? "content-with-player" : ""}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>
            {/* Featured Stories Grid */}
            <section className="mb-6">
              <div className="featured-grid">
                {featuredStories.map((story) => (
                  <FeaturedStoryCard
                    key={story._id}
                    story={story}
                    onClick={() => handleStoryClick(story)}
                  />
                ))}
                {/* Create Story Card */}
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
              <section className="mb-6">
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
  onClick,
}: {
  story: StoryForPlayer;
  onClick: () => void;
}) {
  const THEME_GRADIENT_CSS: Record<string, string> = {
    adventure: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
    animals: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
    space: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    ocean: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
    fairy: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    dinosaurs: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  };

  const THEME_EMOJIS: Record<string, string> = {
    adventure: "🏔️",
    animals: "🦁",
    space: "🚀",
    ocean: "🐠",
    fairy: "🧚",
    dinosaurs: "🦕",
  };

  const theme = story.theme || "adventure";
  const gradient = THEME_GRADIENT_CSS[theme] || THEME_GRADIENT_CSS.adventure;
  const emoji = THEME_EMOJIS[theme] || "📖";

  return (
    <button
      onClick={onClick}
      className="story-card story-card-medium w-full text-left"
    >
      <div className="story-card-image-container">
        <div className="story-card-gradient" style={{ background: gradient }}>
          <span className="story-card-emoji">{emoji}</span>
        </div>
        <div className="story-card-overlay">
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
  const THEME_GRADIENT_CSS: Record<string, string> = {
    adventure: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
    animals: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
    space: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    ocean: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
    fairy: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    dinosaurs: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  };

  const THEME_EMOJIS: Record<string, string> = {
    adventure: "🏔️",
    animals: "🦁",
    space: "🚀",
    ocean: "🐠",
    fairy: "🧚",
    dinosaurs: "🦕",
  };

  const theme = story.theme || "adventure";
  const gradient = THEME_GRADIENT_CSS[theme] || THEME_GRADIENT_CSS.adventure;
  const emoji = THEME_EMOJIS[theme] || "📖";

  return (
    <button
      onClick={onClick}
      className="story-card story-card-small text-left"
    >
      <div className="story-card-image-container">
        <div className="story-card-gradient" style={{ background: gradient }}>
          <span className="story-card-emoji text-3xl">{emoji}</span>
        </div>
        <div className="story-card-overlay">
          <h3 className="story-card-title text-xs">{story.childName}</h3>
        </div>
      </div>
    </button>
  );
}
