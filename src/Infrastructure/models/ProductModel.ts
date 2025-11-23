import mongoose, { Schema, Document } from "mongoose";

export interface DbProduct extends Document {
  name: string;
  imageUrl?: string;
  price: number;
  owner: mongoose.Types.ObjectId;
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<DbProduct>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    price: { type: Number, required: true, min: 0 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<DbProduct>("Product", ProductSchema);