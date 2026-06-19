import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string;
  staleThresholdDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    staleThresholdDays: { type: Number, required: true, default: 14 },
  },
  { timestamps: true }
);

export const UserSettings =
  models.UserSettings || model<IUserSettings>('UserSettings', UserSettingsSchema);
