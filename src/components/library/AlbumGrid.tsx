"use client";

import { useEffect, useState } from "react";
import { AlbumCard } from "./AlbumCard";
import type { Album } from "@/types/player";

export function AlbumGrid() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const res = await fetch("/api/library/albums");
        if (!res.ok) {
          throw new Error("Failed to fetch albums");
        }
        const data = await res.json();
        setAlbums(data.albums || []);
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to load your library");
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="album-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[4/5] bg-gradient-to-br from-gray-700/50 to-gray-800/50 relative">
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="h-4 bg-gray-200/20 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200/20 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <span className="text-4xl mb-4">😔</span>
        <p className="text-secondary text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <span className="text-5xl mb-4">🎵</span>
        <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
        <p className="text-secondary text-center text-sm max-w-xs">
          Create your first bedtime story and it will appear here in your
          library!
        </p>
      </div>
    );
  }

  return (
    <div className="album-grid">
      {albums.map((album) => (
        <AlbumCard key={album.voiceId} album={album} />
      ))}
    </div>
  );
}
