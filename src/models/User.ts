import mongoose, { Schema, Document } from "mongoose";

export type VoiceType = "cloned" | "preset";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  phone?: string;
  elevenlabsVoiceId?: string;  // Cloned voice ID
  voiceType: VoiceType;        // Whether to use cloned or preset voice
  presetVoiceId?: string;      // Selected preset voice ID
  stripeCustomerId?: string;
  profileImageUrl?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    elevenlabsVoiceId: {
      type: String,
    },
    voiceType: {
      type: String,
      enum: ["cloned", "preset"],
      default: "cloned",
    },
    presetVoiceId: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
    profileImageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
