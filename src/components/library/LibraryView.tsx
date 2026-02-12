"use client";

import { AlbumGrid } from "./AlbumGrid";

export function LibraryView() {
  return (
    <div className="flex-1 overflow-y-auto pb-24 relative">
      {/* Floating decorative blobs */}
      <div className="library-bg-decor">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header with organic shape */}
      <div className="library-header">
        <div className="library-header-icon">
          <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
            <defs>
              <linearGradient id="noteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path d="M18 8v24c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c1.5 0 2.9.4 4 1.1V4l24-4v28c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c1.5 0 2.9.4 4 1.1V8L18 10"
              fill="url(#noteGrad)"
              opacity="0.9"
            />
          </svg>
        </div>
        <h1 className="library-title">My Library</h1>
        <p className="library-subtitle">
          All your stories, organized by voice
        </p>
      </div>

      {/* Album Grid */}
      <AlbumGrid />
    </div>
  );
}
