"use client";

import { usePlayer } from "./PlayerProvider";

interface ProgressBarProps {
  showTime?: boolean;
  compact?: boolean;
}

export function ProgressBar({ showTime = true, compact = false }: ProgressBarProps) {
  const { state, dispatch, audioRef } = usePlayer();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    dispatch({ type: "SEEK", time });
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (compact) {
    // Compact version for mini player
    return (
      <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={state.duration || 100}
        value={state.currentTime}
        onChange={handleSeek}
        className="w-full player-progress"
        aria-label="Seek"
      />
      {showTime && (
        <div className="flex justify-between text-sm text-secondary mt-2 tabular-nums">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      )}
    </div>
  );
}
