"use client";

import Link from "next/link";
import type { Album } from "@/types/player";

// Muted colors for glassmorphic album tiles
const THEME_COLORS: Record<string, string> = {
  adventure: "rgba(255, 107, 53, 0.3)",
  animals: "rgba(86, 171, 47, 0.3)",
  space: "rgba(102, 126, 234, 0.3)",
  ocean: "rgba(0, 210, 255, 0.3)",
  fairy: "rgba(240, 147, 251, 0.3)",
  dinosaurs: "rgba(17, 153, 142, 0.3)",
};

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  // Get themes from cover stories for the 2x2 grid
  const coverThemes = album.coverStories.map((story) => story.theme || "adventure");

  // Fill to 4 items for the grid
  while (coverThemes.length < 4) {
    coverThemes.push(coverThemes[0] || "adventure");
  }

  // Truncate email for display
  const displayEmail = album.ownerEmail
    ? album.ownerEmail.length > 20
      ? album.ownerEmail.substring(0, 17) + "..."
      : album.ownerEmail
    : "Unknown Voice";

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
      <div className="glass-card p-4 hover:scale-[1.02] transition-transform cursor-pointer">
        {/* 2x2 Album Art Grid - Glassmorphic */}
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden mb-3">
          {coverThemes.slice(0, 4).map((theme, index) => {
            const color = THEME_COLORS[theme] || THEME_COLORS.adventure;
            return (
              <div
                key={index}
                className="aspect-square flex items-center justify-center overflow-hidden relative"
                style={{
                  background: `rgba(255, 255, 255, 0.05)`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Subtle color accent */}
                <div
                  className="absolute inset-0"
                  style={{ background: color }}
                />
                <img
                  src={`/themes/${theme}.jpg`}
                  alt={theme}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Album Info */}
        <div>
          <p className="font-semibold text-sm truncate">{displayEmail}</p>
          <div className="flex items-center gap-2 text-xs text-secondary mt-1">
            <span>
              {album.storyCount} {album.storyCount === 1 ? "story" : "stories"}
            </span>
            <span className="w-1 h-1 bg-gray-400 rounded-full" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
