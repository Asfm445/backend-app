import mongoose from "mongoose";
import dotenv from "dotenv";
import { app } from "./app";
import { initUserRegisteredConsumer } from "./consumers/userRegisteredConsumer";

dotenv.config();

// ----------------------
// 🔹 MongoDB Connection
// ----------------------
mongoose
  .connect(process.env.MONGODB_URL || "mongodb://localhost:27017/userdb")
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    try {
      await initUserRegisteredConsumer();
    } catch (err) {
      console.error("❌ Consumer init failed:", err);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ----------------------
// 🔹 Start Server
// ----------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));