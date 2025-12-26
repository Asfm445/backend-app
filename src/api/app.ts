import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoUserRepository } from "../Infrastructure/repositories/MongoUserRepository";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controllers/controller";
import { JwtService } from "../Infrastructure/services/jwt_service";
import { BcryptPasswordHasher } from "../Infrastructure/services/password_hasher";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { createGoogleAuthRouter } from "./routes/googleAuth";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { MongoProductRepository } from "../Infrastructure/repositories/MongoProductRepository";
import { ProductUseCase } from "../usecase/product_usecase";
import { ProductController } from "./controllers/product_controller";
import { authenticate } from "./middlewares/auth_middlewares";
import { upload } from "./middlewares/upload";
import { generalRateLimiter, bruteForceRateLimiter } from "./middlewares/rate_limitor";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(responseLogger);

const API_PREFIX = "/api/v1";

// Serve swagger UI at /api/v1/docs
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ----------------------
// 🔹 Dependency Injection
// ----------------------
const userRepo = new MongoUserRepository();
const jwtService = new JwtService();
const passHasher = new BcryptPasswordHasher();
const userUseCase = new UserUseCase(userRepo, jwtService, passHasher);
const userController = new UserController(userUseCase);

// Initialize product repository and use case
const productRepo = new MongoProductRepository();
const productUseCase = new ProductUseCase(productRepo);
const productController = new ProductController(productUseCase);

// ----------------------
// 🔹 Routes (versioned)
// ----------------------
// Users / Auth
app.post(`${API_PREFIX}/users`, generalRateLimiter, userController.register);
app.post(`${API_PREFIX}/auth/login`, bruteForceRateLimiter, userController.login);
app.post(`${API_PREFIX}/auth/refresh`, bruteForceRateLimiter, userController.refreshToken);
app.use(`${API_PREFIX}/auth`, generalRateLimiter, createGoogleAuthRouter(userController));

// Product routes
const authRoles = ["user", "admin", "superadmin"];

app.post(
    `${API_PREFIX}/products`,
    authenticate(authRoles),
    upload.single("image"),
    generalRateLimiter,
    productController.create.bind(productController)
);

app.get(
    `${API_PREFIX}/products/analytics`,
    generalRateLimiter,
    authenticate(["admin", "superadmin"]),
    productController.analytics.bind(productController)
);

app.get(`${API_PREFIX}/products/:id`, generalRateLimiter, productController.getById.bind(productController));
app.get(`${API_PREFIX}/products`, generalRateLimiter, productController.list.bind(productController));

app.put(
    `${API_PREFIX}/products/:id`,
    authenticate(authRoles),
    upload.single("image"),
    generalRateLimiter,
    productController.update.bind(productController)
);

app.delete(
    `${API_PREFIX}/products/:id`,
    authenticate(authRoles),
    generalRateLimiter,
    productController.delete.bind(productController)
);

// Google OAuth Route
app.use("/auth", createGoogleAuthRouter(userController));

// Error Handling
app.use(errorHandler);

export { app };
