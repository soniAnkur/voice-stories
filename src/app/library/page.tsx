"use client";

import { LibraryView } from "@/components/library/LibraryView";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function LibraryPage() {
  const { state } = usePlayer();

  return (
    <div className="page-container">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 pt-14">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Library</h1>
      </header>

      {/* Library Content */}
      <main className={state.isMiniVisible ? "content-with-player" : ""}>
        <LibraryView />
      </main>
    </div>
  );
}
