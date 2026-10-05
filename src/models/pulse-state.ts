import mongoose, { Schema, type Model } from "mongoose";

export type PulseStateDocument = { ownerId: string; data: Record<string, unknown>; createdAt: Date; updatedAt: Date };
const PulseStateSchema = new Schema<PulseStateDocument>({
  ownerId: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true, default: {} },
}, { timestamps: true, minimize: false, versionKey: false });

export const PulseState = (mongoose.models.PulseState as Model<PulseStateDocument> | undefined)
  ?? mongoose.model<PulseStateDocument>("PulseState", PulseStateSchema);
