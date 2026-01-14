"use client";

import { usePlayer } from "@/components/player/PlayerProvider";
import type { StoryForPlayer } from "@/types/player";
import { THEME_GRADIENTS } from "@/types/player";

interface StoryListItemProps {
  story: StoryForPlayer;
  index: number;
  queue: StoryForPlayer[];
}

export function StoryListItem({ story, index, queue }: StoryListItemProps) {
  const { state, dispatch } = usePlayer();

  const isCurrentStory = state.currentStory?._id === story._id;
  const isPlaying = isCurrentStory && state.isPlaying;

  const theme = story.theme || "adventure";
  const gradient = THEME_GRADIENTS[theme] || "from-blue-400 to-blue-500";

  // Format date
  const formattedDate = new Date(story.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handlePlay = () => {
    if (isCurrentStory) {
      dispatch({ type: "TOGGLE_PLAY" });
    } else {
      dispatch({ type: "PLAY_STORY", story, queue });
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={`glass-card-subtle p-3 flex items-center gap-3 w-full text-left transition-all hover:bg-white/60 active:scale-[0.98] ${
        isCurrentStory ? "ring-2 ring-blue-500" : ""
      }`}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {/* Theme Image / Play-Pause Icon */}
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 transition-transform overflow-hidden`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : isCurrentStory ? (
          <svg className="w-4 h-4 ml-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <img
            src={`/themes/${theme}.jpg`}
            alt={theme}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient if image fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}</div>

      {/* Story Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-medium text-sm truncate ${
              isCurrentStory ? "text-blue-500" : ""
            }`}
          >
            {story.childName}&apos;s Story
          </p>
          {isPlaying && (
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-blue-500 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-3 bg-blue-500 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
          <span className="capitalize">{theme}</span>
          <span className="w-1 h-1 bg-gray-400 rounded-full" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Story number */}
      <span className="text-xs text-tertiary tabular-nums">{index + 1}</span>
    </button>
  );
}
