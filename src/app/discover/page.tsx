"use client";

import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerProvider";

const THEMES = [
  { id: "adventure", label: "Adventure", emoji: "🏔️", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", glow: "rgba(249, 115, 22, 0.4)" },
  { id: "animals", label: "Animals", emoji: "🦁", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", glow: "rgba(34, 197, 94, 0.4)" },
  { id: "space", label: "Space", emoji: "🚀", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", glow: "rgba(139, 92, 246, 0.4)" },
  { id: "ocean", label: "Ocean", emoji: "🐠", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", glow: "rgba(6, 182, 212, 0.4)" },
  { id: "fairy", label: "Fairy Tales", emoji: "🧚", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", glow: "rgba(236, 72, 153, 0.4)" },
  { id: "dinosaurs", label: "Dinosaurs", emoji: "🦕", gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)", glow: "rgba(132, 204, 22, 0.4)" },
];

const FEATURED_CATEGORIES = [
  { title: "New Releases", icon: "✨", count: 12, gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", glow: "rgba(167, 139, 250, 0.4)" },
  { title: "Most Popular", icon: "🔥", count: 24, gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", glow: "rgba(251, 146, 60, 0.4)" },
  { title: "Quick Stories", icon: "⏱️", count: 8, gradient: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)", glow: "rgba(56, 189, 248, 0.4)" },
  { title: "Sleep Time", icon: "😴", count: 15, gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)", glow: "rgba(129, 140, 248, 0.4)" },
];

export default function DiscoverPage() {
  const { state } = usePlayer();

  return (
    <div className="page-container">
      {/* Floating decorative blobs */}
      <div className="discover-bg-decor">
        <div className="discover-blob discover-blob-1" />
        <div className="discover-blob discover-blob-2" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 pt-14 relative z-10">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Discover</h1>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 ${state.isMiniVisible ? "content-with-player" : ""}`}>
        {/* Search Bar - Fancy */}
        <div className="px-4 mb-6">
          <div
            className="search-bar-fancy"
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
            }}
          >
            <svg
              className="search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
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
              className="search-input-fancy"
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Theme Categories - Fancy */}
        <section className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Browse by Theme</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '0 16px',
            }}
          >
            {THEMES.map((theme, index) => (
              <Link
                key={theme.id}
                href={`/discover/${theme.id}`}
                style={{ textDecoration: 'none', position: 'relative' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: theme.gradient,
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{theme.emoji}</span>
                  <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{theme.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Categories - Fancy */}
        <section className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Collections</h2>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              overflowX: 'auto',
              padding: '8px 16px 16px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {FEATURED_CATEGORIES.map((category) => (
              <div
                key={category.title}
                style={{
                  flexShrink: 0,
                  minWidth: '130px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '20px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: category.gradient,
                      borderRadius: '16px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{category.icon}</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'white', textAlign: 'center' }}>{category.title}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>{category.count} stories</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create Your Own CTA - Fancy */}
        <section className="px-4 mb-8">
          <Link
            href="/create"
            style={{
              display: 'block',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '26px',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  borderRadius: '18px',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'white', marginBottom: '4px' }}>Create Your Own Story</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Personalized bedtime tales in your voice</p>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
