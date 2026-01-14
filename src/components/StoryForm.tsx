"use client";

import { useState } from "react";

interface StoryFormProps {
  onSubmit: (data: {
    email: string;
    voiceId: string;
    childName: string;
    childAge: number;
    interests: string;
    theme: string;
    customPrompt: string;
  }) => void;
}

const THEMES = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "animals", label: "Animals", emoji: "🦁" },
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "ocean", label: "Ocean", emoji: "🐠" },
  { id: "fairy", label: "Fairy Tale", emoji: "🧚" },
  { id: "dinosaurs", label: "Dinosaurs", emoji: "🦕" },
];

export function StoryForm({ onSubmit }: StoryFormProps) {
  const [identityMode, setIdentityMode] = useState<"email" | "voiceId">("email");
  const [email, setEmail] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(5);
  const [interests, setInterests] = useState("");
  const [theme, setTheme] = useState("adventure");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit({ email, voiceId, childName, childAge, interests, theme, customPrompt });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="story-form">
      {/* Email or Voice ID Toggle */}
      <div>
        <label className="block text-sm font-medium mb-2">Identity Mode</label>
        <div className="flex gap-2 mb-3 p-1 glass-card-subtle rounded-xl">
          <button
            type="button"
            onClick={() => setIdentityMode("email")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              identityMode === "email"
                ? "bg-white shadow-sm"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setIdentityMode("voiceId")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              identityMode === "voiceId"
                ? "bg-white shadow-sm"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Voice ID
          </button>
        </div>

        {identityMode === "email" ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={identityMode === "email"}
              placeholder="parent@example.com"
              className="input-glass"
            />
            <p className="text-xs text-tertiary mt-2">
              We will save your voice for future stories
            </p>
          </>
        ) : (
          <>
            <input
              type="text"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              required={identityMode === "voiceId"}
              placeholder="ElevenLabs Voice ID"
              className="input-glass"
            />
            <p className="text-xs text-tertiary mt-2">
              Use an existing ElevenLabs voice ID to generate the story
            </p>
          </>
        )}
      </div>

      {/* Child's Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Child&apos;s First Name</label>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          required
          placeholder="Emma"
          className="input-glass"
        />
      </div>

      {/* Child's Age */}
      <div>
        <label className="block text-sm font-medium mb-2">Child&apos;s Age</label>
        <select
          value={childAge}
          onChange={(e) => setChildAge(Number(e.target.value))}
          className="input-glass cursor-pointer"
        >
          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((age) => (
            <option key={age} value={age}>
              {age} years old
            </option>
          ))}
        </select>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium mb-2">
          What does {childName || "your child"} love?
        </label>
        <input
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          required
          placeholder="dinosaurs, their dog Max, building blocks"
          className="input-glass"
        />
        <p className="text-xs text-tertiary mt-2">
          We will include these in the story!
        </p>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium mb-3">Story Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`glass-card-subtle px-3 py-3 text-sm flex flex-col items-center gap-1 transition-all ${
                theme === t.id
                  ? "ring-2 ring-blue-500 bg-white/80"
                  : "hover:bg-white/60"
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Story Prompt <span className="text-tertiary">(optional)</span>
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Describe what the story should be about..."
          rows={3}
          className="input-glass resize-none"
        />
        <p className="text-xs text-tertiary mt-2">
          Add custom instructions for the story content
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full text-lg mt-8"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </span>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}
