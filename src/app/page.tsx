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

// Muted accent colors for glassmorphic cards
const THEME_COLORS: Record<string, string> = {
  adventure: "rgba(255, 107, 53, 0.35)",
  animals: "rgba(86, 171, 47, 0.35)",
  space: "rgba(102, 126, 234, 0.35)",
  ocean: "rgba(0, 210, 255, 0.35)",
  fairy: "rgba(240, 147, 251, 0.35)",
  dinosaurs: "rgba(17, 153, 142, 0.35)",
};

// SVG patterns for each theme - centered and contained
function ThemePattern({ theme, color }: { theme: string; color: string }) {
  switch (theme) {
    case "adventure":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M20 75 L35 45 L50 65 L65 35 L80 75 Z" fill={color} />
        </svg>
      );
    case "animals":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="58" rx="14" ry="11" fill={color} />
          <circle cx="35" cy="42" r="6" fill={color} />
          <circle cx="50" cy="36" r="6" fill={color} />
          <circle cx="65" cy="42" r="6" fill={color} />
        </svg>
      );
    case "space":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="50" rx="28" ry="10" stroke={color} strokeWidth="2" transform="rotate(-20 50 50)" />
          <ellipse cx="50" cy="50" rx="22" ry="8" stroke={color} strokeWidth="2" transform="rotate(30 50 50)" />
          <circle cx="50" cy="50" r="6" fill={color} />
          <circle cx="30" cy="38" r="2" fill={color} />
          <circle cx="70" cy="58" r="2" fill={color} />
        </svg>
      );
    case "ocean":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M15 45 Q35 35, 50 45 T85 45" stroke={color} strokeWidth="3" fill="none" />
          <path d="M15 55 Q35 45, 50 55 T85 55" stroke={color} strokeWidth="2.5" fill="none" />
          <path d="M15 65 Q35 55, 50 65 T85 65" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    case "fairy":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M50 25 L52 45 L50 50 L48 45 Z" fill={color} />
          <path d="M50 75 L48 55 L50 50 L52 55 Z" fill={color} />
          <path d="M25 50 L45 48 L50 50 L45 52 Z" fill={color} />
          <path d="M75 50 L55 52 L50 50 L55 48 Z" fill={color} />
          <circle cx="50" cy="50" r="4" fill={color} />
          <circle cx="35" cy="35" r="2" fill={color} />
          <circle cx="65" cy="65" r="2" fill={color} />
        </svg>
      );
    case "dinosaurs":
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M50 75 L50 30" stroke={color} strokeWidth="3" />
          <path d="M50 38 Q38 42, 34 50" stroke={color} strokeWidth="2" fill="none" />
          <path d="M50 38 Q62 42, 66 50" stroke={color} strokeWidth="2" fill="none" />
          <path d="M50 50 Q36 54, 30 62" stroke={color} strokeWidth="2" fill="none" />
          <path d="M50 50 Q64 54, 70 62" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

// Featured Story Card Component
function FeaturedStoryCard({
  story,
  onClick,
}: {
  story: StoryForPlayer;
  onClick: () => void;
}) {
  const theme = story.theme || "adventure";
  const color = THEME_COLORS[theme] || THEME_COLORS.adventure;

  return (
    <button
      onClick={onClick}
      className="story-card story-card-medium w-full text-left"
    >
      <div className="story-card-image-container">
        <div className="story-card-glass">
          <div className="story-card-pattern">
            <ThemePattern theme={theme} color={color} />
          </div>
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
  const theme = story.theme || "adventure";
  const color = THEME_COLORS[theme] || THEME_COLORS.adventure;

  return (
    <button
      onClick={onClick}
      className="story-card story-card-small text-left"
    >
      <div className="story-card-image-container">
        <div className="story-card-glass">
          <div className="story-card-pattern">
            <ThemePattern theme={theme} color={color} />
          </div>
        </div>
        <div className="story-card-overlay">
          <h3 className="story-card-title text-xs">{story.childName}</h3>
        </div>
      </div>
    </button>
  );
}
