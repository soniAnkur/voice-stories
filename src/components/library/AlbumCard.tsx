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

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  // Get a consistent gradient based on email hash
  const gradientIndex = album.ownerEmail
    ? album.ownerEmail.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % FALLBACK_GRADIENTS.length
    : 0;
  const fallbackGradient = FALLBACK_GRADIENTS[gradientIndex];

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

  return (
    <Link href={`/album/${encodeURIComponent(album.voiceId)}`}>
      <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer">
        {/* Background with profile image or gradient */}
        <div
          className="aspect-[4/5] relative"
          style={{
            background: album.profileImageUrl ? undefined : fallbackGradient,
          }}
        >
          {/* Profile Image */}
          {album.profileImageUrl && (
            <img
              src={album.profileImageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          {/* Fallback initials when no profile image */}
          {!album.profileImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-white/40">{initials || "?"}</span>
            </div>
          )}

          {/* Animated glow ring on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-4 rounded-full border-2 border-white/20 animate-pulse" />
          </div>

          {/* Story count badge */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-xs font-medium text-white">
              {album.storyCount} {album.storyCount === 1 ? "story" : "stories"}
            </span>
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Info section at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-semibold text-white text-base truncate mb-1">
              {displayName}
            </h3>
            <p className="text-white/60 text-xs">{formattedDate}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
