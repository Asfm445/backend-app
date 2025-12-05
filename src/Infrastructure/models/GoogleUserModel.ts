// Infrastructure/models/GoogleUserModel.ts
import mongoose, { Document, Schema } from "mongoose";

export interface DbGoogleUser extends Document {
  name: string;
  email: string;
  googleId: string;
  role: string;
}

const GoogleUserSchema = new Schema<DbGoogleUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export const GoogleUserModel = mongoose.model<DbGoogleUser>(
  "GoogleUser",
  GoogleUserSchema
);
