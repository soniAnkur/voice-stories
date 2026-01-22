import mongoose, { Schema, Document } from "mongoose";

export type StoryStatus = "preview" | "paid" | "generating" | "complete" | "failed";

export interface IStory extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  voiceId?: string; // Direct ElevenLabs voice ID (when not using user lookup)
  childName: string;
  childAge: number;
  interests: string;
  theme?: string;
  customPrompt?: string;
  storyText?: string;
  previewText?: string;
  previewUrl?: string;
  fullAudioUrl?: string;
  backgroundMusicPrompt?: string;
  // Music mixing fields
  musicTrackId?: string;
  musicSource?: "library" | "mubert" | "suno";
  hasMusicMixed?: boolean;
  musicVolume?: number;
  status: StoryStatus;
  stripeSessionId?: string;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    voiceId: {
      type: String,
    },
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    childAge: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    interests: {
      type: String,
      required: true,
    },
    theme: {
      type: String,
      default: "adventure",
    },
    customPrompt: {
      type: String,
    },
    storyText: {
      type: String,
    },
    previewText: {
      type: String,
    },
    previewUrl: {
      type: String,
    },
    fullAudioUrl: {
      type: String,
    },
    backgroundMusicPrompt: {
      type: String,
    },
    // Music mixing fields
    musicTrackId: {
      type: String,
    },
    musicSource: {
      type: String,
      enum: ["library", "mubert", "suno"],
    },
    hasMusicMixed: {
      type: Boolean,
      default: false,
    },
    musicVolume: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ["preview", "paid", "generating", "complete", "failed"],
      default: "preview",
    },
    stripeSessionId: {
      type: String,
    },
    couponCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StorySchema.index({ userId: 1 });
StorySchema.index({ status: 1 });

export const Story = mongoose.models.Story || mongoose.model<IStory>("Story", StorySchema);
