import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoUserRepository } from "../Infrastructure/repositories/MongoUserRepository";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controllers/controller";
import { JwtService } from "../Infrastructure/services/jwt_service";
import { BcryptPasswordHasher } from "../Infrastructure/services/password_hasher";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { createGoogleAuthRouter } from "./routes/googleAuth";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { MongoProductRepository } from "../Infrastructure/repositories/MongoProductRepository"; // Import the product repository
import { ProductUseCase } from "../usecase/product_usecase"; // Import the product use case
import { ProductController } from "./controllers/product_controller"; // Import the product controller
import { authenticate } from "./middlewares/auth_middlewares";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(responseLogger);

// Serve swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// Initialize product repository and use case
const productRepo = new MongoProductRepository(); // Create an instance of the product repository
const productUseCase = new ProductUseCase(productRepo); // Create an instance of the product use case
const productController = new ProductController(productUseCase); // Create an instance of the product controller

// ----------------------
// 🔹 Routes
// ----------------------
app.post("/register", userController.register);
app.post("/login", userController.login);
app.post("/refresh", userController.refreshToken);
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Product routes (require authentication for mutating operations)
const authRoles = ["user", "admin", "superadmin"];

app.post(
  "/products",
  authenticate(authRoles),
  productController.create.bind(productController)
); // Create a new product

app.get(
  "/products/:id",
  productController.getById.bind(productController)
); // Get product by ID (public)

app.get(
  "/products",
  productController.list.bind(productController)
); // List all products (public)

app.put(
  "/products/:id",
  authenticate(authRoles),
  productController.update.bind(productController)
); // Update product by ID

app.delete(
  "/products/:id",
  authenticate(authRoles),
  productController.delete.bind(productController)
); // Delete product by ID

// ----------------------
// 🔹 Google OAuth Route
// ----------------------
app.use("/auth", createGoogleAuthRouter(userController));

// ----------------------
// 🔹 Error Handling
// ----------------------
app.use(errorHandler);

// ----------------------
// 🔹 Start Server
// ----------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));