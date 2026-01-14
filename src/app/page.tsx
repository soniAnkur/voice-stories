"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TabNavigation } from "@/components/library/TabNavigation";
import { LibraryView } from "@/components/library/LibraryView";

const THEMES = [
  { id: "adventure", label: "Adventure" },
  { id: "animals", label: "Animals" },
  { id: "space", label: "Space" },
  { id: "ocean", label: "Ocean" },
  { id: "fairy", label: "Fairy Tale" },
  { id: "dinosaurs", label: "Dinosaurs" },
];

type Step = 1 | 2 | 3 | 4 | 5;

interface ChildInfo {
  childName: string;
  childAge: number;
  interests: string;
  storyCount: number;
  lastStoryDate: string;
}

interface FormData {
  identityMode: "email" | "voiceId";
  email: string;
  voiceId: string;
  childName: string;
  childAge: number;
  interests: string;
  theme: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingVoice, setHasExistingVoice] = useState(false);

  // Children state
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showChildrenList, setShowChildrenList] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    identityMode: "email",
    email: "",
    voiceId: "",
    childName: "",
    childAge: 5,
    interests: "",
    theme: "adventure",
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const goToStep = (newStep: Step) => {
    if (animating) return;
    setDirection(newStep > step ? "forward" : "backward");
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 350);
  };

  const nextStep = () => {
    if (step < 5) goToStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) goToStep((step - 1) as Step);
  };

  // Fetch children when email is entered
  const handleEmailContinue = async () => {
    if (formData.identityMode === "voiceId") {
      nextStep();
      return;
    }

    setLoadingChildren(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await res.json();

      if (result.userId) {
        setUserId(result.userId);
      }
      if (result.hasVoice) {
        setHasExistingVoice(true);
      }

      if (result.children && result.children.length > 0) {
        setChildren(result.children);
        setShowChildrenList(true);
      } else {
        nextStep();
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      nextStep();
    } finally {
      setLoadingChildren(false);
    }
  };

  // Select existing child
  const handleSelectChild = (index: number) => {
    const child = children[index];
    setSelectedChildIndex(index);
    setFormData((prev) => ({
      ...prev,
      childName: child.childName,
      childAge: child.childAge,
      interests: child.interests,
    }));
  };

  // Continue with selected or new child
  const handleChildrenContinue = () => {
    setShowChildrenList(false);
    goToStep(3); // Skip to story details since we have child info
  };

  // Add new child
  const handleAddNewChild = () => {
    setSelectedChildIndex(null);
    setFormData((prev) => ({
      ...prev,
      childName: "",
      childAge: 5,
      interests: "",
    }));
    setShowChildrenList(false);
    nextStep();
  };

  // Step 3 -> Check voice or go to recording
  const handleStoryDetailsSubmit = async () => {
    if (formData.voiceId) {
      setHasExistingVoice(true);
      goToStep(5);
      await createStoryWithVoiceId();
      return;
    }

    try {
      const res = await fetch("/api/voice/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await res.json();
      setUserId(result.userId);

      if (result.hasVoice) {
        setHasExistingVoice(true);
        goToStep(5);
        await createStory(result.userId, null);
      } else {
        goToStep(4);
      }
    } catch (error) {
      console.error("Error checking voice:", error);
      goToStep(4);
    }
  };

  const handleVoiceComplete = async (voiceSampleUrl: string) => {
    goToStep(5);
    await createStory(userId!, voiceSampleUrl);
  };

  const createStoryWithVoiceId = async () => {
    try {
      const res = await fetch("/api/story/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: formData.voiceId,
          childName: formData.childName,
          childAge: formData.childAge,
          interests: formData.interests,
          theme: formData.theme,
        }),
      });
      const result = await res.json();
      if (result.storyId) {
        window.location.href = `/preview/${result.storyId}`;
      }
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const createStory = async (uid: string, voiceSampleUrl: string | null) => {
    try {
      const res = await fetch("/api/story/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          voiceSampleUrl,
          childName: formData.childName,
          childAge: formData.childAge,
          interests: formData.interests,
          theme: formData.theme,
          email: formData.email,
        }),
      });
      const result = await res.json();
      if (result.storyId) {
        window.location.href = `/preview/${result.storyId}`;
      }
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.identityMode === "email"
          ? formData.email.includes("@")
          : formData.voiceId.length > 0;
      case 2:
        return formData.childName.trim().length > 0;
      case 3:
        return formData.interests.trim().length > 0;
      default:
        return true;
    }
  };

  const getAnimationClass = () => {
    if (!animating) return "slide-in-right";
    return direction === "forward" ? "slide-out-left" : "slide-out-right";
  };

  // Show back button in wizard mode when not on step 1 or 5
  const showBack = activeTab === "create" && step > 1 && step < 5 && !showChildrenList;

  return (
    <>
      <Header showBack={showBack} onBack={prevStep} />

      <div className="app-container">
        {/* Tab Navigation - only show when not in wizard processing */}
        {(activeTab === "library" || (step === 1 && !showChildrenList)) && (
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Library View */}
        {activeTab === "library" && <LibraryView />}

        {/* Create Story Wizard */}
        {activeTab === "create" && (
          <>
            {/* Progress Dots */}
            {step < 5 && step > 1 && !showChildrenList && (
              <div className="progress-dots">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`progress-dot ${s === step ? "active" : ""} ${s < step ? "completed" : ""}`}
                  />
                ))}
              </div>
            )}

            <div className="wizard-container">
              {/* Children Selection (shown after email entry if children exist) */}
              {showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                    <div className="text-center mb-6">
                      <span className="inline-block text-4xl mb-3">👨‍👩‍👧‍👦</span>
                      <h2 className="text-xl font-bold mb-2">Select a Child</h2>
                      <p className="text-secondary text-sm">
                        Choose an existing child or add a new one
                      </p>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {children.map((child, index) => (
                        <button
                          key={`${child.childName}-${child.childAge}`}
                          onClick={() => handleSelectChild(index)}
                          className={`w-full glass-card p-4 text-left transition-all ${
                            selectedChildIndex === index
                              ? "ring-2 ring-blue-500 bg-white/80"
                              : "hover:bg-white/60"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                              {child.childName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-lg">{child.childName}</div>
                              <div className="text-sm text-secondary">
                                {child.childAge} years old
                              </div>
                              <div className="text-xs text-tertiary mt-1 truncate">
                                Interests: {child.interests}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-tertiary">
                                {child.storyCount} {child.storyCount === 1 ? "story" : "stories"}
                              </div>
                              {selectedChildIndex === index && (
                                <span className="text-blue-500 text-lg">✓</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}

                      {/* Add New Child Button */}
                      <button
                        onClick={handleAddNewChild}
                        className="w-full glass-card-subtle p-4 text-left hover:bg-white/60 transition-all border-2 border-dashed border-gray-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">
                            +
                          </div>
                          <div>
                            <div className="font-semibold">Add New Child</div>
                            <div className="text-sm text-secondary">
                              Create a story for someone new
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Welcome & Identity */}
              {step === 1 && !showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                      <span className="inline-block text-5xl mb-4 animate-bounce-soft">🌙</span>
                      <h1 className="text-2xl font-bold mb-2">Bedtime Stories in YOUR Voice</h1>
                      <p className="text-secondary text-sm">
                        Create magical tales narrated by you
                      </p>
                    </div>

                    <div className="glass-card p-6">
                      <div className="flex gap-2 mb-4 p-1 glass-card-subtle rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateField("identityMode", "email")}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            formData.identityMode === "email"
                              ? "bg-white shadow-sm"
                              : "text-secondary"
                          }`}
                        >
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("identityMode", "voiceId")}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            formData.identityMode === "voiceId"
                              ? "bg-white shadow-sm"
                              : "text-secondary"
                          }`}
                        >
                          Voice ID
                        </button>
                      </div>

                      {formData.identityMode === "email" ? (
                        <div>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            placeholder="parent@example.com"
                            className="input-glass"
                            autoFocus
                          />
                          <p className="text-xs text-tertiary mt-2">
                            We&apos;ll save your voice for future stories
                          </p>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={formData.voiceId}
                            onChange={(e) => updateField("voiceId", e.target.value)}
                            placeholder="ElevenLabs Voice ID"
                            className="input-glass"
                            autoFocus
                          />
                          <p className="text-xs text-tertiary mt-2">
                            Use an existing ElevenLabs voice
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Child Info */}
              {step === 2 && !showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                      <span className="inline-block text-4xl mb-3">👶</span>
                      <h2 className="text-xl font-bold mb-2">Tell us about your child</h2>
                      <p className="text-secondary text-sm">
                        We&apos;ll personalize the story just for them
                      </p>
                    </div>

                    <div className="glass-card p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Child&apos;s First Name
                        </label>
                        <input
                          type="text"
                          value={formData.childName}
                          onChange={(e) => updateField("childName", e.target.value)}
                          placeholder="Emma"
                          className="input-glass"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Child&apos;s Age
                        </label>
                        <select
                          value={formData.childAge}
                          onChange={(e) => updateField("childAge", Number(e.target.value))}
                          className="input-glass cursor-pointer"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((age) => (
                            <option key={age} value={age}>
                              {age} years old
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Story Details */}
              {step === 3 && !showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                    <div className="text-center mb-6">
                      <span className="inline-block text-4xl mb-3">✨</span>
                      <h2 className="text-xl font-bold mb-2">Customize the story</h2>
                      <p className="text-secondary text-sm">
                        What should {formData.childName || "your child"}&apos;s adventure be about?
                      </p>
                    </div>

                    <div className="glass-card p-6 space-y-5 flex-1">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          What does {formData.childName || "your child"} love?
                        </label>
                        <input
                          type="text"
                          value={formData.interests}
                          onChange={(e) => updateField("interests", e.target.value)}
                          placeholder="dinosaurs, dogs, building blocks..."
                          className="input-glass"
                          autoFocus
                        />
                        <p className="text-xs text-tertiary mt-2">
                          We&apos;ll include these in the story!
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3">Story Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                          {THEMES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => updateField("theme", t.id)}
                              className={`glass-card-subtle px-3 py-3 text-sm flex flex-col items-center gap-2 transition-all ${
                                formData.theme === t.id
                                  ? "ring-2 ring-blue-500 bg-white/80"
                                  : "hover:bg-white/60"
                              }`}
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                <img
                                  src={`/themes/${t.id}.jpg`}
                                  alt={t.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Voice Recording */}
              {step === 4 && !showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                    <div className="text-center mb-6">
                      <span className="inline-block text-4xl mb-3 animate-pulse-soft">🎙️</span>
                      <h2 className="text-xl font-bold mb-2">Record Your Voice</h2>
                      <p className="text-secondary text-sm">
                        Read the sample text in your storytelling voice
                      </p>
                    </div>

                    <div className="flex-1">
                      <VoiceRecorder onComplete={handleVoiceComplete} userId={userId!} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Processing */}
              {step === 5 && !showChildrenList && (
                <div className={`step-content ${getAnimationClass()}`}>
                  <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                    <div className="glass-card p-10 text-center w-full">
                      <div className="mb-6">
                        <div className="relative inline-block">
                          <div className="spinner mx-auto" style={{ width: 56, height: 56, borderWidth: 4 }} />
                          <span className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse-soft">
                            ✨
                          </span>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold mb-2">Creating Your Preview</h2>
                      <p className="text-secondary text-sm">
                        {hasExistingVoice
                          ? "Using your saved voice..."
                          : "Cloning your voice and generating story..."}
                      </p>
                      <p className="text-xs text-tertiary mt-4">
                        This takes about 30 seconds
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Footer with Navigation */}
            {showChildrenList && (
              <div className="step-footer">
                <div className="max-w-md mx-auto">
                  <button
                    onClick={handleChildrenContinue}
                    disabled={selectedChildIndex === null}
                    className="btn-primary w-full"
                  >
                    Continue with {selectedChildIndex !== null ? children[selectedChildIndex].childName : "Selected Child"}
                  </button>
                </div>
              </div>
            )}

            {!showChildrenList && step < 4 && (
              <div className="step-footer">
                <div className="max-w-md mx-auto">
                  <button
                    onClick={step === 1 ? handleEmailContinue : step === 3 ? handleStoryDetailsSubmit : nextStep}
                    disabled={!canProceed() || loadingChildren}
                    className="btn-primary w-full"
                  >
                    {loadingChildren ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner" style={{ width: 20, height: 20 }} />
                        Loading...
                      </span>
                    ) : step === 3 ? (
                      "Create Story"
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
