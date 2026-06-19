import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IApplication extends Document {
  _id: Types.ObjectId;
  userId: string;
  userEmail: string; // Denormalized from token — used by cron reminder job
  company: string;
  role: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  appliedDate?: Date;
  jobUrl?: string;
  notes?: string;
  lastUpdated: Date;
  lastReminderSent?: Date;
  createdAt: Date;
  source?: 'manual' | 'extension' | 'csv_import';
  capturedAt?: Date;
  originalUrl?: string;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true }, // Denormalized for cron reliability
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ['Applied', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
      required: true,
    },
    appliedDate: { type: Date },
    jobUrl: { type: String },
    notes: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    lastReminderSent: { type: Date },
    source: {
      type: String,
      enum: ['manual', 'extension', 'csv_import'],
      default: 'manual',
    },
    capturedAt: { type: Date },
    originalUrl: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Compound index for filtered list queries and stats aggregation
ApplicationSchema.index({ userId: 1, status: 1 });

export const Application =
  models.Application || model<IApplication>('Application', ApplicationSchema);
