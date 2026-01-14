"use client";

import { useRef, useCallback } from "react";
import { usePlayer } from "./PlayerProvider";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { THEME_GRADIENTS } from "@/types/player";

export function FullPlayer() {
  const { state, dispatch } = usePlayer();
  const touchStartY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Swipe down to collapse
      if (deltaY > 100) {
        dispatch({ type: "COLLAPSE" });
      }
    },
    [dispatch]
  );

  const handleCollapse = useCallback(() => {
    dispatch({ type: "COLLAPSE" });
  }, [dispatch]);

  const handleClose = useCallback(() => {
    dispatch({ type: "CLOSE" });
  }, [dispatch]);

  if (!state.isExpanded || !state.currentStory) {
    return null;
  }

  const theme = state.currentStory.theme || "adventure";
  const gradient = THEME_GRADIENTS[theme] || "from-blue-400 to-blue-500";

  return (
    <div
      className="full-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient} opacity-20`} />
      <div className="absolute inset-0 backdrop-blur-xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={handleCollapse}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Collapse"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <span className="text-sm font-medium text-secondary">Now Playing</span>

          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div
            className={`w-64 h-64 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl overflow-hidden`}
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
        </div>

        {/* Story Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {state.currentStory.childName}&apos;s Story
          </h2>
          <p className="text-secondary capitalize">{theme} Adventure</p>
          {state.currentStory.interests && (
            <p className="text-xs text-tertiary mt-2 max-w-xs mx-auto truncate">
              Featuring: {state.currentStory.interests}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar showTime />
        </div>

        {/* Controls */}
        <div className="mb-8">
          <PlayerControls size="full" showSkip />
        </div>

        {/* Queue Info */}
        {state.queue.length > 1 && (
          <div className="text-center pb-6">
            <p className="text-xs text-tertiary">
              {state.queueIndex + 1} of {state.queue.length} stories
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
