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
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "storyteller",
    icon: "📚",
    title: "Storyteller",
    description: "Created 10 stories",
    requirement: 10,
    type: "created",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "master-narrator",
    icon: "🎭",
    title: "Master Narrator",
    description: "Created 30 stories",
    requirement: 30,
    type: "created",
    color: "from-pink-500 to-red-500",
  },
  {
    id: "listener",
    icon: "🎧",
    title: "Listener",
    description: "Listened to 20 stories",
    requirement: 20,
    type: "listened",
    color: "from-green-500 to-teal-500",
  },
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
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                {profile?.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <h2 className="profile-name">
                {profile?.email?.split("@")[0] || "Guest"}
              </h2>
              <p className="profile-email">{profile?.email || "Not signed in"}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 px-4 mb-8">
              <div className="dark-card p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {profile?.storiesCreated || 0}
                </div>
                <div className="text-sm text-secondary">Stories Created</div>
              </div>
              <div className="dark-card p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {profile?.storiesListened || 0}
                </div>
                <div className="text-sm text-secondary">Stories Listened</div>
              </div>
            </div>

            {/* Achievements */}
            <section className="mb-8">
              <div className="section-header">
                <h2 className="section-title">Achievements</h2>
                <span className="text-secondary text-sm">View More</span>
              </div>
              <div className="horizontal-scroll">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = isAchievementUnlocked(achievement);
                  const progress = getAchievementProgress(achievement);

                  return (
                    <div
                      key={achievement.id}
                      className={`achievement-badge ${unlocked ? "" : "locked"}`}
                    >
                      <div
                        className={`achievement-icon bg-gradient-to-br ${achievement.color}`}
                        style={{ opacity: unlocked ? 1 : 0.4 }}
                      >
                        {achievement.icon}
                      </div>
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                      {!unlocked && (
                        <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Settings */}
            <section className="px-4 mb-8">
              <h2 className="section-title mb-4">Settings</h2>
              <div className="space-y-2">
                <button className="w-full dark-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    <span>Notifications</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full dark-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎙️</span>
                    <span>Voice Settings</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full dark-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❓</span>
                    <span>Help & Support</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full dark-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📜</span>
                    <span>Terms & Privacy</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
