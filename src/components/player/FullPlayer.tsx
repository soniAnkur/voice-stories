"use client";

import { useRef, useCallback } from "react";
import { usePlayer } from "./PlayerProvider";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";

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
  const coverImage = state.currentStory.coverImageUrl || `/themes/${theme}.jpg`;
  const isPlaying = state.isPlaying;

  return (
    <div
      className="full-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Blurred Album Art Background - stretched to fill */}
      <div className="absolute inset-0 bg-black">
        <img
          src={coverImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'blur(30px) saturate(1.5)',
            transform: 'scale(1.2)',
            opacity: 0.8
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={handleCollapse}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label="Collapse"
          >
            <svg
              className="w-6 h-6 text-white"
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

          <span className="text-sm font-medium text-white/80">Now Playing</span>

          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-white"
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
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Circular Rotating Album Art */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 blur-xl transition-opacity duration-500 ${
                isPlaying ? 'opacity-100 animate-pulse' : 'opacity-50'
              }`}
              style={{ transform: 'scale(1.1)' }}
            />

            {/* Vinyl disc effect - outer ring */}
            <div className="relative w-72 h-72 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl">
              {/* Vinyl grooves effect */}
              <div className="absolute inset-4 rounded-full border border-white/5" />
              <div className="absolute inset-8 rounded-full border border-white/5" />
              <div className="absolute inset-12 rounded-full border border-white/5" />

              {/* Album art container - rotates when playing */}
              <div
                className={`w-full h-full rounded-full overflow-hidden shadow-inner ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
                style={{
                  animationPlayState: isPlaying ? 'running' : 'paused',
                }}
              >
                <img
                  src={coverImage}
                  alt={`${state.currentStory.childName}'s Story`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/themes/${theme}.jpg`;
                  }}
                />

                {/* Center hole effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700 shadow-inner" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Info */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-1 text-white drop-shadow-lg">
            {state.currentStory.childName}&apos;s Story
          </h2>
          <p className="text-white/70 capitalize">{theme} Adventure</p>
          {state.currentStory.interests && (
            <p className="text-xs text-white/50 mt-2 max-w-xs mx-auto truncate">
              Featuring: {state.currentStory.interests}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressBar showTime />
        </div>

        {/* Controls */}
        <div className="mb-6">
          <PlayerControls size="full" showSkip />
        </div>

        {/* Queue Info */}
        {state.queue.length > 1 && (
          <div className="text-center pb-4">
            <p className="text-xs text-white/50">
              {state.queueIndex + 1} of {state.queue.length} stories
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
