"use client";

import { usePlayer } from "./PlayerProvider";

interface PlayerControlsProps {
  size?: "mini" | "full";
  showSkip?: boolean;
}

export function PlayerControls({
  size = "full",
  showSkip = true,
}: PlayerControlsProps) {
  const { state, dispatch } = usePlayer();

  const buttonSize = size === "mini" ? "w-10 h-10" : "w-16 h-16";
  const iconSize = size === "mini" ? "w-5 h-5" : "w-7 h-7";
  const skipButtonSize = size === "mini" ? "w-8 h-8" : "w-12 h-12";
  const skipIconSize = size === "mini" ? "w-4 h-4" : "w-5 h-5";

  const hasQueue = state.queue.length > 1;
  const canGoNext = state.queueIndex < state.queue.length - 1;
  const canGoPrevious = state.queueIndex > 0 || state.currentTime > 3;

  const handleTogglePlay = () => {
    dispatch({ type: "TOGGLE_PLAY" });
  };

  const handleNext = () => {
    dispatch({ type: "NEXT" });
  };

  const handlePrevious = () => {
    dispatch({ type: "PREVIOUS" });
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Previous Button */}
      {showSkip && hasQueue && (
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`${skipButtonSize} flex items-center justify-center rounded-full transition-all ${
            canGoPrevious
              ? "text-gray-700 hover:bg-white/20"
              : "text-gray-400 opacity-50"
          }`}
          aria-label="Previous"
        >
          <svg
            className={skipIconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
      )}

      {/* Play/Pause Button */}
      <button
        onClick={handleTogglePlay}
        className={`${buttonSize} bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105`}
        aria-label={state.isPlaying ? "Pause" : "Play"}
      >
        {state.isPlaying ? (
          <svg className={`${iconSize} text-white`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className={`${iconSize} ml-1 text-white`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Next Button */}
      {showSkip && hasQueue && (
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`${skipButtonSize} flex items-center justify-center rounded-full transition-all ${
            canGoNext
              ? "text-gray-700 hover:bg-white/20"
              : "text-gray-400 opacity-50"
          }`}
          aria-label="Next"
        >
          <svg
            className={skipIconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
