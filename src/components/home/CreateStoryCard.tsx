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
        <div
          className="story-card-gradient"
          style={{
            background: "linear-gradient(135deg, var(--accent-purple) 0%, #9c27b0 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Create Story</span>
          </div>
        </div>
      </div>
    </button>
  );
}
