"use client";

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
        <div className="story-card-glass">
          {/* Subtle plus pattern */}
          <div className="story-card-pattern">
            <svg viewBox="0 0 100 100" fill="none">
              <line x1="50" y1="25" x2="50" y2="75" stroke="rgba(124, 77, 255, 0.4)" strokeWidth="4" strokeLinecap="round" />
              <line x1="25" y1="50" x2="75" y2="50" stroke="rgba(124, 77, 255, 0.4)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          {/* Center icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        </div>
        {/* Title Overlay */}
        <div className="story-card-overlay">
          <h3 className="story-card-title">Create Story</h3>
        </div>
      </div>
    </button>
  );
}
