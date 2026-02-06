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
            filter: 'blur(20px) saturate(1.8) brightness(1.1)',
            transform: 'scale(1.3)',
            opacity: 1
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/25" />
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
              className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${
                isPlaying ? 'opacity-80 animate-pulse' : 'opacity-40'
              }`}
              style={{
                transform: 'scale(1.15)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
              }}
            />

            {/* Album art container - rotates when playing */}
            <div
              className={`relative w-72 h-72 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              style={{
                animationPlayState: isPlaying ? 'running' : 'paused',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255,255,255,0.1)'
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
