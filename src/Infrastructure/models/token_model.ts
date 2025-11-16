// src/infrastructure/schemas/token.schema.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IToken extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
  expireAt: Date;
}

const TokenSchema: Schema<IToken> = new Schema({
  id: { type: String, required: true }, // UUID
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, required: true },
});

// Optional: automatically delete expired tokens
TokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const TokenModel = mongoose.model<IToken>("Token", TokenSchema);
