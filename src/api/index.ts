import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoUserRepository } from "../Infrastructure/MongoUserRepository";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controller";
import { JwtService } from "../Infrastructure/services/jwt_service";
import { BcryptPasswordHasher } from "../Infrastructure/services/password_hasher";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { createGoogleAuthRouter } from "./routes/googleAuth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Fixed: removed incorrect 'createGoogleAuthRouter' text
app.use(requestLogger);
app.use(responseLogger);

// ----------------------
// 🔹 MongoDB Connection
// ----------------------
mongoose
  .connect("mongodb://localhost:27017/userdb")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ----------------------
// 🔹 Dependency Injection
// ----------------------
const userRepo = new MongoUserRepository();
const jwtService = new JwtService();
const passHasher = new BcryptPasswordHasher();
const userUseCase = new UserUseCase(userRepo, jwtService, passHasher);
const userController = new UserController(userUseCase);

// ----------------------
// 🔹 Routes
// ----------------------
app.post("/register", userController.register);
app.post("/login", userController.login);
app.post("/refresh", userController.refreshToken);
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Protected example routes
// app.get("/admin/test", authenticate(["admin","superadmin"]), ...)
// app.get("/user/test", authenticate(["user","admin","superadmin"]), ...)

// ----------------------
// 🔹 Google OAuth Route - FIXED
// ----------------------
app.use("/auth", createGoogleAuthRouter(userController)); // Fixed: Pass userController directly

// ----------------------
// 🔹 Error Handling
// ----------------------
app.use(errorHandler);

// ----------------------
// 🔹 Start Server
// ----------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));