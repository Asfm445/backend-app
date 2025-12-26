import Queue from "bull";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export type ImageJobData = {
  productId: string;
  bufferBase64?: string; // base64 encoded buffer - used for transport
  originalName?: string;
  folder?: string;
};

export const imageQueue = new Queue<ImageJobData>("image-queue", redisUrl, {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

// helper to enqueue new jobs (accepts Buffer)
export async function enqueueImageJob(data: { productId: string; buffer: Buffer; originalName?: string; folder?: string }) {
  const payload: ImageJobData = {
    productId: data.productId,
    bufferBase64: data.buffer.toString("base64"),
    originalName: data.originalName,
    folder: data.folder,
  };
  return imageQueue.add(payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true, // <-- MUST use this
    removeOnFail: false,    // <-- optional but recommended
  });

}