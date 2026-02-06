"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";

interface Particle {
  id: number;
  type: "star" | "sparkle" | "dot";
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export function ParticlesBackground() {
  const particles = useMemo(() => {
    const items: Particle[] = [];
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
      const type = i % 3 === 0 ? "star" : i % 3 === 1 ? "sparkle" : "dot";
      items.push({
        id: i,
        type,
        size: type === "star" ? 14 + Math.random() * 8 : 3 + Math.random() * 4,
        x: Math.random() * 100,
        y: Math.random() * 80, // Keep particles in upper 80% of hero
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 4,
      });
    }

    return items;
  }, []);

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle particle-${particle.type}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.type === "star" ? "auto" : particle.size,
            height: particle.type === "star" ? "auto" : particle.size,
            "--delay": `${particle.delay}s`,
            "--duration": `${particle.duration}s`,
          } as React.CSSProperties}
        >
          {particle.type === "star" && (
            <Star
              size={particle.size}
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </div>
      ))}
    </div>
  );
}
