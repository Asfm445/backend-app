import mongoose, { Schema, Document } from "mongoose";

export interface DbUser extends Document {
  name: string;
  email: string;
  password: string;
  age?: number;
  role: string;
}

const UserSchema = new Schema<DbUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [3, "Name must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/.+@.+\..+/, "Invalid email format"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  age: {
    type: Number,
    min: [18, "Minimum age is 18"],
    max: [100, "Maximum age is 100"],
  },
  role: {
    type: String,
    required: true,
    default: "user",
    enum: ["superadmin", "admin", "user"], // optional but recommended
  },
});

export const UserModel = mongoose.model<DbUser>("User", UserSchema);
