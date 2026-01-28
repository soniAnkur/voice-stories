"use client";

import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerProvider";

const THEMES = [
  { id: "adventure", label: "Adventure", emoji: "🏔️", color: "from-orange-500 to-amber-500" },
  { id: "animals", label: "Animals", emoji: "🦁", color: "from-green-500 to-emerald-500" },
  { id: "space", label: "Space", emoji: "🚀", color: "from-indigo-500 to-purple-500" },
  { id: "ocean", label: "Ocean", emoji: "🐠", color: "from-cyan-500 to-blue-500" },
  { id: "fairy", label: "Fairy Tales", emoji: "🧚", color: "from-pink-500 to-rose-500" },
  { id: "dinosaurs", label: "Dinosaurs", emoji: "🦕", color: "from-lime-500 to-green-500" },
];

const FEATURED_CATEGORIES = [
  { title: "New Releases", icon: "✨", count: 12 },
  { title: "Most Popular", icon: "🔥", count: 24 },
  { title: "Quick Stories", icon: "⏱️", count: 8 },
  { title: "Sleep Time", icon: "😴", count: 15 },
];

export default function DiscoverPage() {
  const { state } = usePlayer();

  return (
    <div className="page-container">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 pt-14">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Discover</h1>
      </header>

      {/* Main Content */}
      <main className={state.isMiniVisible ? "content-with-player" : ""}>
        {/* Search Bar */}
        <div className="px-4 mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search stories..."
              className="input-dark pl-12"
            />
          </div>
        </div>

        {/* Theme Categories */}
        <section className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Browse by Theme</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {THEMES.map((theme) => (
              <Link
                key={theme.id}
                href={`/discover/${theme.id}`}
                className={`dark-card p-4 flex items-center gap-3 bg-gradient-to-br ${theme.color} bg-opacity-20`}
              >
                <span className="text-3xl">{theme.emoji}</span>
                <span className="font-semibold">{theme.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Categories */}
        <section className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Collections</h2>
          </div>
          <div className="horizontal-scroll">
            {FEATURED_CATEGORIES.map((category) => (
              <div
                key={category.title}
                className="dark-card p-4 min-w-[140px] flex flex-col items-center gap-2"
              >
                <span className="text-3xl">{category.icon}</span>
                <span className="font-semibold text-sm text-center">{category.title}</span>
                <span className="text-xs text-secondary">{category.count} stories</span>
              </div>
            ))}
          </div>
        </section>

        {/* Create Your Own CTA */}
        <section className="px-4 mb-8">
          <Link
            href="/create"
            className="dark-card p-6 flex items-center gap-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create Your Own Story</h3>
              <p className="text-sm text-secondary">Personalized bedtime tales in your voice</p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
