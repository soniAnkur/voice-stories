import mongoose, { Schema, Document } from "mongoose";

export type StoryStatus = "preview" | "paid" | "generating" | "complete" | "failed";
export type VideoStatus = "pending" | "generating" | "complete" | "failed";

// Video generation progress tracking
export interface IVideoProgress {
  step: "analyzing" | "images" | "videos" | "uploading" | "complete";
  stepNumber: number;
  totalSteps: number;
  currentItem?: number;
  totalItems?: number;
  message: string;
  startedAt?: Date;
  updatedAt?: Date;
}

// Story section for video mode
export interface IStorySection {
  sectionNumber: number;
  title: string;
  text: string;
  cinematicDescription: string;
  startImageUrl?: string;
  endImageUrl?: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
}

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
  coverImageUrl?: string;
  backgroundMusicPrompt?: string;
  // Music mixing fields
  musicTrackId?: string;
  musicSource?: "library" | "mubert";
  hasMusicMixed?: boolean;
  musicVolume?: number;
  status: StoryStatus;
  stripeSessionId?: string;
  // Video mode fields
  childImageUrl?: string;          // Kid's reference photo for style
  storySections?: IStorySection[]; // Array of section data
  finalVideoUrl?: string;          // Final stitched video
  videoMode?: boolean;             // true = video story, false = audio only
  videoStatus?: VideoStatus;       // Video generation status
  videoProgress?: IVideoProgress;  // Detailed progress tracking
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
    coverImageUrl: {
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
      enum: ["library", "mubert"],
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
    // Video mode fields
    childImageUrl: {
      type: String,
    },
    storySections: [
      {
        sectionNumber: { type: Number },
        title: { type: String },
        text: { type: String },
        cinematicDescription: { type: String },
        startImageUrl: { type: String },
        endImageUrl: { type: String },
        videoUrl: { type: String },
        videoDurationSeconds: { type: Number },
      },
    ],
    finalVideoUrl: {
      type: String,
    },
    videoMode: {
      type: Boolean,
      default: false,
    },
    videoStatus: {
      type: String,
      enum: ["pending", "generating", "complete", "failed"],
    },
    videoProgress: {
      step: { type: String, enum: ["analyzing", "images", "videos", "uploading", "complete"] },
      stepNumber: { type: Number },
      totalSteps: { type: Number },
      currentItem: { type: Number },
      totalItems: { type: Number },
      message: { type: String },
      startedAt: { type: Date },
      updatedAt: { type: Date },
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
