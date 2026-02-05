"use client";

import { Plus } from "lucide-react";

interface CreateStoryCardProps {
  onClick: () => void;
}

export function CreateStoryCard({ onClick }: CreateStoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="story-card story-card-medium w-full"
      type="button"
    >
      <div className="story-card-image-container">
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(124, 77, 255, 0.3) 0%, rgba(236, 64, 122, 0.2) 100%)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
            <Plus size={28} strokeWidth={2.5} className="text-white/90" />
          </div>
          <div className="text-center px-3">
            <h3 className="text-sm font-bold text-white">Create Story</h3>
            <p className="text-xs text-white/50 mt-1">Tap to begin</p>
          </div>
        </div>
      </div>
    </button>
  );
}
