"use client";

import { Plus } from "lucide-react";
import { ParticlesBackground } from "./ParticlesBackground";
import type { StoryForPlayer } from "@/types/player";

interface HeroSectionProps {
  featuredStory?: StoryForPlayer;
  onCreateStory: () => void;
}

export function HeroSection({ featuredStory, onCreateStory }: HeroSectionProps) {
  const hasImage = featuredStory?.coverImageUrl;

  return (
    <section className={`hero-section ${!hasImage ? "hero-fallback-bg" : ""}`}>
      {/* Background Image */}
      <div className="hero-background">
        {hasImage && (
          <img
            src={featuredStory.coverImageUrl}
            alt="Featured story"
            className="hero-background-image"
            loading="eager"
          />
        )}
        <div className="hero-gradient-overlay" />
      </div>

      {/* Floating Particles */}
      <ParticlesBackground />

      {/* Hero Content */}
      <div className="hero-content">
        <h1 className="hero-title">
          Stories in <span className="hero-title-accent">YOUR Voice</span>
        </h1>
        <p className="hero-subtitle">
          Create magical bedtime tales your child will treasure
        </p>
        <button className="hero-cta" onClick={onCreateStory}>
          <Plus size={20} strokeWidth={2.5} />
          Create Story
        </button>
      </div>
    </section>
  );
}
