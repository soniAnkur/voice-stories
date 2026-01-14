import { connectDB } from "@/lib/mongodb";
import { Story } from "@/models/Story";
import { User } from "@/models/User";
import { AudioPlayer } from "@/components/AudioPlayer";
import { PaymentButton } from "@/components/PaymentButton";
import { FreeAccessButton } from "@/components/FreeAccessButton";
import { Features } from "@/lib/features";
import { notFound } from "next/navigation";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  await connectDB();

  const story = await Story.findById(id).lean();

  if (!story) {
    notFound();
  }

  const user = story.userId ? await User.findById(story.userId).lean() : null;

  return (
    <>
      <header className="header-glass">
        <div className="w-full max-w-lg mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <span className="font-semibold text-sm">Voice Bedtime Tales</span>
          </div>
        </div>
      </header>

      <div className="app-container">
        <div className="step-content">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block text-5xl mb-4 animate-bounce-soft">🌙</span>
              <h1 className="text-2xl font-bold mb-2">
                {story.childName}&apos;s Story
              </h1>
              <p className="text-secondary text-sm">
                30-second preview
              </p>
            </div>

            {/* Audio Player */}
            <div className="mb-6">
              {story.previewUrl ? (
                <AudioPlayer
                  src={story.previewUrl}
                  title="Story Preview"
                />
              ) : (
                <div className="glass-card p-8 text-center">
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <div className="spinner mx-auto" style={{ width: 48, height: 48, borderWidth: 4 }} />
                      <span className="absolute inset-0 flex items-center justify-center text-xl animate-pulse-soft">
                        ✨
                      </span>
                    </div>
                  </div>
                  <p className="text-secondary text-sm">Generating your preview...</p>
                </div>
              )}
            </div>

            {/* Story Details */}
            <div className="glass-card-subtle p-5 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                📚 Story Details
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex gap-2">
                  <span className="text-secondary w-16">For:</span>
                  <span>{story.childName}, {story.childAge} years old</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-secondary w-16">Theme:</span>
                  <span className="capitalize">{story.theme}</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-secondary w-16">Interests:</span>
                  <span>{story.interests}</span>
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="glass-card p-6 text-center">
              <h2 className="text-lg font-bold mb-1">Love what you hear?</h2>
              <p className="text-secondary text-sm mb-5">
                Get the full 5-minute story
              </p>

              <div className="mb-4">
                {Features.BYPASS_PAYMENT ? (
                  <FreeAccessButton storyId={story._id.toString()} />
                ) : (
                  <PaymentButton
                    storyId={story._id.toString()}
                    userId={story.userId?.toString() || ""}
                    email={user?.email || ""}
                  />
                )}
              </div>

              <p className="text-xs text-tertiary">
                Download forever • Your voice • Just for {story.childName}
              </p>
            </div>

            {/* Back Link */}
            <div className="text-center mt-8">
              <a
                href="/"
                className="text-accent text-sm font-medium"
              >
                ← Create a different story
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
