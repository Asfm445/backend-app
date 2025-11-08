import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { MongoUserRepository } from "../Infrastructure/MongoUserRepository"; // new
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controller";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { log } from "../api/utils/logger";

const app = express();

// Start-up logs
log.info("🚀 Starting app...");

// Middleware
app.use(requestLogger);
app.use(responseLogger);
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/userdb")
  .then(() => log.info("✅ Connected to MongoDB"))
  .catch((err) => {
    log.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// Dependency injection
const userRepo = new MongoUserRepository(); // now uses MongoDB instead of memory
const userUseCase = new UserUseCase(userRepo);
const userController = new UserController(userUseCase);

// Routes
app.post("/register", userController.register);
app.post("/login", userController.login);
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(3000, () => {
  log.info("🚀 Server running on http://localhost:3000");
});
