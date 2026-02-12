"use client";

import Link from "next/link";
import type { Album } from "@/types/player";

// Gradient backgrounds for cards without profile images
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
];

// Glow colors matching gradients
const GLOW_COLORS = [
  "rgba(102, 126, 234, 0.5)",
  "rgba(240, 147, 251, 0.5)",
  "rgba(79, 172, 254, 0.5)",
  "rgba(67, 233, 123, 0.5)",
  "rgba(250, 112, 154, 0.5)",
  "rgba(161, 140, 209, 0.5)",
  "rgba(255, 154, 158, 0.5)",
  "rgba(102, 126, 234, 0.5)",
];

interface AlbumCardProps {
  album: Album;
  index?: number;
}

export function AlbumCard({ album, index = 0 }: AlbumCardProps) {
  // Get a consistent gradient based on email hash
  const gradientIndex = album.ownerEmail
    ? album.ownerEmail.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % FALLBACK_GRADIENTS.length
    : 0;
  const fallbackGradient = FALLBACK_GRADIENTS[gradientIndex];
  const glowColor = GLOW_COLORS[gradientIndex];

  // Truncate email for display - show first part before @
  const displayName = album.ownerEmail
    ? album.ownerEmail.split("@")[0].length > 15
      ? album.ownerEmail.split("@")[0].substring(0, 12) + "..."
      : album.ownerEmail.split("@")[0]
    : "Unknown Voice";

  // Get initials for fallback
  const initials = displayName
    .split(/[._-]/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  // Format date
  const formattedDate = new Date(album.latestStoryDate).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );

  // Masonry effect - vary heights based on story count or index
  const heightVariant = album.storyCount > 10 ? "tall" : album.storyCount > 3 ? "medium" : "short";
  const aspectRatio = heightVariant === "tall" ? "aspect-[3/5]" : heightVariant === "medium" ? "aspect-[4/5]" : "aspect-square";

  return (
    <Link href={`/album/${encodeURIComponent(album.voiceId)}`}>
      <div
        className="album-card-wrapper group"
        style={{
          animationDelay: `${index * 0.1}s`,
          ["--glow-color" as string]: glowColor,
        }}
      >
        {/* Outer glow layer */}
        <div className="album-card-glow" />

        {/* Main card with glassmorphism */}
        <div className="album-card-inner">
          {/* Background with profile image or gradient */}
          <div
            className={`${aspectRatio} relative overflow-hidden`}
            style={{
              background: album.profileImageUrl ? undefined : fallbackGradient,
            }}
          >
            {/* Profile Image */}
            {album.profileImageUrl && (
              <img
                src={album.profileImageUrl}
                alt={displayName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            {/* Fallback initials when no profile image */}
            {!album.profileImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-white/30 drop-shadow-lg">{initials || "?"}</span>
              </div>
            )}

            {/* Magical sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="sparkle sparkle-1" />
              <div className="sparkle sparkle-2" />
              <div className="sparkle sparkle-3" />
            </div>

            {/* Animated glow ring on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
              <div className="absolute inset-3 rounded-[28px] border border-white/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
            </div>

            {/* Story count badge - floating pill style */}
            <div className="absolute top-3 right-3 story-count-badge">
              <span className="relative z-10 text-xs font-semibold text-white">
                {album.storyCount} {album.storyCount === 1 ? "story" : "stories"}
              </span>
            </div>

            {/* Bottom gradient overlay - softer organic feel */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Info section at bottom with glass effect */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-3 border border-white/10">
                <h3 className="font-bold text-white text-base truncate mb-0.5 drop-shadow-lg">
                  {displayName}
                </h3>
                <p className="text-white/70 text-xs font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
