import { imageQueue } from "../queue/imageQueue";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { MongoProductRepository } from "../../Infrastructure/repositories/MongoProductRepository";
import mongoose from "mongoose";

const repo = new MongoProductRepository();

mongoose
  .connect(process.env.MONGODB_URL || "mongodb://localhost:27017/userdb")
  .then(() => console.log("✅ Worker connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Worker MongoDB connection failed:", err);
    process.exit(1);
  });

// Process jobs (concurrency 2)
imageQueue.process(2, async (job) => {
  const { productId, bufferBase64, originalName, folder } = job.data;
  if (!bufferBase64) throw new Error("No buffer supplied for image job");

  const buffer = Buffer.from(bufferBase64, "base64");

  try {
    // Upload to Cloudinary
    const result = await uploadBufferToCloudinary(buffer, folder || "products");

    // Update product with image URL
    console.log("Updating product with image URL:", result.secure_url);
    await repo.update(productId, { imageUrl: result.secure_url });

    return { imageUrl: result.secure_url };
  } catch (err) {
    // throw to let Bull handle retries/backoff
    throw err;
  }
});

// optional: graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down image worker...");
  await imageQueue.close();
  process.exit(0);
});