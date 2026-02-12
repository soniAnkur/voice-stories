"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerProvider";

interface UserProfile {
  email: string;
  storiesCreated: number;
  storiesListened: number;
}

const ACHIEVEMENTS = [
  {
    id: "first-story",
    icon: "🎉",
    title: "First Story",
    description: "Created your first story",
    requirement: 1,
    type: "created",
    gradient: "linear-gradient(135deg, #eab308, #f97316)",
    glow: "rgba(234, 179, 8, 0.4)",
  },
  {
    id: "storyteller",
    icon: "📚",
    title: "Storyteller",
    description: "Created 10 stories",
    requirement: 10,
    type: "created",
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    glow: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "master-narrator",
    icon: "🎭",
    title: "Master Narrator",
    description: "Created 30 stories",
    requirement: 30,
    type: "created",
    gradient: "linear-gradient(135deg, #ec4899, #ef4444)",
    glow: "rgba(236, 72, 153, 0.4)",
  },
  {
    id: "listener",
    icon: "🎧",
    title: "Listener",
    description: "Listened to 20 stories",
    requirement: 20,
    type: "listened",
    gradient: "linear-gradient(135deg, #22c55e, #14b8a6)",
    glow: "rgba(34, 197, 94, 0.4)",
  },
];

const SETTINGS = [
  { icon: "🔔", label: "Notifications", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { icon: "🎙️", label: "Voice Settings", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  { icon: "❓", label: "Help & Support", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
  { icon: "📜", label: "Terms & Privacy", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
];

export default function ProfilePage() {
  const { state } = usePlayer();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, use mock data. In production, fetch from API
    setTimeout(() => {
      setProfile({
        email: "parent@example.com",
        storiesCreated: 5,
        storiesListened: 12,
      });
      setLoading(false);
    }, 500);
  }, []);

  const getAchievementProgress = (achievement: typeof ACHIEVEMENTS[0]) => {
    if (!profile) return 0;
    const current = achievement.type === "created" ? profile.storiesCreated : profile.storiesListened;
    return Math.min(current / achievement.requirement, 1);
  };

  const isAchievementUnlocked = (achievement: typeof ACHIEVEMENTS[0]) => {
    return getAchievementProgress(achievement) >= 1;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 pt-14">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Profile</h1>
        <Link href="/premium" className="btn-gold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          Unlock all stories
        </Link>
      </header>

      {/* Main Content */}
      <main className={state.isMiniVisible ? "content-with-player" : ""}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>
            {/* Profile Header - Fancy */}
            <div style={{ textAlign: 'center', padding: '24px 16px 32px', position: 'relative' }}>
              {/* Avatar with glow */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    filter: 'blur(15px)',
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    fontWeight: 700,
                    color: 'white',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  {profile?.email?.charAt(0).toUpperCase() || "?"}
                </div>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                {profile?.email?.split("@")[0] || "Guest"}
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {profile?.email || "Not signed in"}
              </p>
            </div>

            {/* Stats - Fancy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '0 16px', marginBottom: '32px' }}>
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
                    borderRadius: '50%',
                    filter: 'blur(20px)',
                  }}
                />
                <div style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
                  {profile?.storiesCreated || 0}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Stories Created</div>
              </div>
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(34, 197, 94, 0.3))',
                    borderRadius: '50%',
                    filter: 'blur(20px)',
                  }}
                />
                <div style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #22d3ee, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
                  {profile?.storiesListened || 0}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Stories Listened</div>
              </div>
            </div>

            {/* Achievements - Fancy */}
            <section style={{ marginBottom: '32px' }}>
              <div className="section-header">
                <h2 className="section-title">Achievements</h2>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>View More</span>
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
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = isAchievementUnlocked(achievement);
                  const progress = getAchievementProgress(achievement);

                  return (
                    <div
                      key={achievement.id}
                      style={{
                        flexShrink: 0,
                        minWidth: '140px',
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '20px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '24px',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: unlocked ? 1 : 0.6,
                        }}
                      >
                        {/* Glow effect for unlocked */}
                        {unlocked && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: '-10px',
                              background: achievement.glow,
                              filter: 'blur(25px)',
                              opacity: 0.4,
                            }}
                          />
                        )}
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: achievement.gradient,
                            borderRadius: '20px',
                            fontSize: '28px',
                            marginBottom: '12px',
                            boxShadow: unlocked ? '0 8px 25px rgba(0, 0, 0, 0.3)' : 'none',
                            position: 'relative',
                          }}
                        >
                          {achievement.icon}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'white', textAlign: 'center', marginBottom: '4px', position: 'relative' }}>
                          {achievement.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', position: 'relative' }}>
                          {achievement.description}
                        </div>
                        {!unlocked && (
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: achievement.gradient,
                                borderRadius: '2px',
                                width: `${progress * 100}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Settings - Fancy */}
            <section style={{ padding: '0 16px', marginBottom: '32px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SETTINGS.map((setting, index) => (
                  <button
                    key={setting.label}
                    style={{
                      width: '100%',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: setting.gradient,
                          borderRadius: '14px',
                          fontSize: '20px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {setting.icon}
                      </div>
                      <span style={{ fontWeight: 500, color: 'white', fontSize: '15px' }}>{setting.label}</span>
                    </div>
                    <svg style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
