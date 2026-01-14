"use client";

import { useRef, useCallback } from "react";
import { usePlayer } from "./PlayerProvider";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { THEME_GRADIENTS } from "@/types/player";

export function MiniPlayer() {
  const { state, dispatch } = usePlayer();
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      // Swipe up to expand
      if (deltaY > 50) {
        dispatch({ type: "EXPAND" });
      }
    },
    [dispatch]
  );

  const handleClick = useCallback(() => {
    dispatch({ type: "EXPAND" });
  }, [dispatch]);

  const handleControlClick = useCallback((e: React.MouseEvent) => {
    // Prevent expand when clicking controls
    e.stopPropagation();
  }, []);

  if (!state.isMiniVisible || !state.currentStory || state.isExpanded) {
    return null;
  }

  const theme = state.currentStory.theme || "adventure";
  const gradient = THEME_GRADIENTS[theme] || "from-blue-400 to-blue-500";

  return (
    <div
      ref={containerRef}
      className="mini-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0">
        <ProgressBar compact />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Album Art */}
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden`}
        >
          <img
            src={`/themes/${theme}.jpg`}
            alt={theme}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Story Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {state.currentStory.childName}&apos;s Story
          </p>
          <p className="text-xs text-secondary truncate capitalize">
            {theme} Adventure
          </p>
        </div>

        {/* Controls */}
        <div onClick={handleControlClick}>
          <PlayerControls size="mini" showSkip={false} />
        </div>

        {/* Expand indicator */}
        <div className="w-1 h-6 bg-gray-300 rounded-full ml-2" />
      </div>
    </div>
  );
}
