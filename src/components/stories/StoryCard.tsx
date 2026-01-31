"use client";

import Link from "next/link";

// Muted accent colors for glassmorphic cards
const THEME_COLORS: Record<string, string> = {
  adventure: "rgba(255, 107, 53, 0.35)",
  animals: "rgba(86, 171, 47, 0.35)",
  space: "rgba(102, 126, 234, 0.35)",
  ocean: "rgba(0, 210, 255, 0.35)",
  fairy: "rgba(240, 147, 251, 0.35)",
  dinosaurs: "rgba(17, 153, 142, 0.35)",
};

// SVG patterns for each theme - centered and contained within viewBox
const ThemePatterns: Record<string, React.FC<{ color: string }>> = {
  // Adventure - Layered mountain silhouettes
  adventure: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M20 75 L35 45 L50 65 L65 35 L80 75 Z" fill={color} />
    </svg>
  ),
  // Animals - Paw print pattern
  animals: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <ellipse cx="50" cy="58" rx="14" ry="11" fill={color} />
      <circle cx="35" cy="42" r="6" fill={color} />
      <circle cx="50" cy="36" r="6" fill={color} />
      <circle cx="65" cy="42" r="6" fill={color} />
    </svg>
  ),
  // Space - Orbital rings with dots
  space: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <ellipse cx="50" cy="50" rx="28" ry="10" stroke={color} strokeWidth="2" transform="rotate(-20 50 50)" />
      <ellipse cx="50" cy="50" rx="22" ry="8" stroke={color} strokeWidth="2" transform="rotate(30 50 50)" />
      <circle cx="50" cy="50" r="6" fill={color} />
      <circle cx="30" cy="38" r="2" fill={color} />
      <circle cx="70" cy="58" r="2" fill={color} />
    </svg>
  ),
  // Ocean - Flowing wave lines
  ocean: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M15 45 Q35 35, 50 45 T85 45" stroke={color} strokeWidth="3" fill="none" />
      <path d="M15 55 Q35 45, 50 55 T85 55" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M15 65 Q35 55, 50 65 T85 65" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  ),
  // Fairy - Sparkle/starburst pattern
  fairy: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M50 25 L52 45 L50 50 L48 45 Z" fill={color} />
      <path d="M50 75 L48 55 L50 50 L52 55 Z" fill={color} />
      <path d="M25 50 L45 48 L50 50 L45 52 Z" fill={color} />
      <path d="M75 50 L55 52 L50 50 L55 48 Z" fill={color} />
      <circle cx="50" cy="50" r="4" fill={color} />
      <circle cx="35" cy="35" r="2" fill={color} />
      <circle cx="65" cy="35" r="2" fill={color} />
      <circle cx="35" cy="65" r="2" fill={color} />
      <circle cx="65" cy="65" r="2" fill={color} />
    </svg>
  ),
  // Dinosaurs - Leaf/fern frond pattern
  dinosaurs: ({ color }) => (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M50 75 L50 30" stroke={color} strokeWidth="3" />
      <path d="M50 38 Q38 42, 34 50" stroke={color} strokeWidth="2" fill="none" />
      <path d="M50 38 Q62 42, 66 50" stroke={color} strokeWidth="2" fill="none" />
      <path d="M50 50 Q36 54, 30 62" stroke={color} strokeWidth="2" fill="none" />
      <path d="M50 50 Q64 54, 70 62" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  ),
};

interface StoryCardProps {
  story: {
    _id: string;
    childName: string;
    theme?: string;
    interests?: string;
    coverImageUrl?: string;
    status?: string;
  };
  size?: "small" | "medium" | "large";
  showDuration?: boolean;
  duration?: number; // in minutes
  showCheckmark?: boolean;
  onClick?: () => void;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function StoryCard({
  story,
  size = "medium",
  showDuration = false,
  duration,
  showCheckmark = false,
  onClick,
}: StoryCardProps) {
  const theme = story.theme || "adventure";
  const accentColor = THEME_COLORS[theme] || THEME_COLORS.adventure;
  const PatternComponent = ThemePatterns[theme] || ThemePatterns.adventure;

  // Generate a title based on child name and theme
  const title = `${story.childName}'s ${theme.charAt(0).toUpperCase() + theme.slice(1)} Story`;

  const CardContent = (
    <>
      {/* Image Container */}
      <div className="story-card-image-container">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={title}
            className="story-card-image"
            loading="lazy"
          />
        ) : (
          <div className="story-card-glass">
            {/* Abstract pattern */}
            <div className="story-card-pattern">
              <PatternComponent color={accentColor} />
            </div>
          </div>
        )}

        {/* Duration Badge */}
        {showDuration && duration && (
          <span className="duration-badge">{formatDuration(duration)}</span>
        )}

        {/* Checkmark Badge */}
        {showCheckmark && (
          <div className="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Title Overlay */}
        <div className="story-card-overlay">
          <h3 className="story-card-title">{title}</h3>
          {story.interests && (
            <p className="story-card-subtitle">{story.interests.split(",")[0]}</p>
          )}
        </div>
      </div>
    </>
  );

  const className = `story-card story-card-${size}`;

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {CardContent}
      </button>
    );
  }

  return (
    <Link href={`/story/${story._id}`} className={className}>
      {CardContent}
    </Link>
  );
}

// Smaller variant for horizontal scroll
export function StoryCardSmall({
  story,
  duration,
  onClick,
}: {
  story: StoryCardProps["story"];
  duration?: number;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      story={story}
      size="small"
      showDuration={!!duration}
      duration={duration}
      onClick={onClick}
    />
  );
}

// Featured card for 2x2 grid
export function StoryCardFeatured({
  story,
  showCheckmark = false,
  onClick,
}: {
  story: StoryCardProps["story"];
  showCheckmark?: boolean;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      story={story}
      size="medium"
      showCheckmark={showCheckmark}
      onClick={onClick}
    />
  );
}
