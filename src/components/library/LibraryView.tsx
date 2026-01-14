"use client";

import { AlbumGrid } from "./AlbumGrid";

export function LibraryView() {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-4 py-6 text-center">
        <span className="inline-block text-4xl mb-3">🎵</span>
        <h1 className="text-xl font-bold mb-1">My Library</h1>
        <p className="text-secondary text-sm">
          All your stories, organized by voice
        </p>
      </div>

      {/* Album Grid */}
      <AlbumGrid />
    </div>
  );
}
