import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
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

app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", service: "main-api", timestamp: new Date().toISOString() });
});

app.get("/ready", async (req, res) => {
    const isMongoConnected = require("mongoose").connection.readyState === 1;
    const status = isMongoConnected ? "READY" : "NOT_READY";
    res.status(isMongoConnected ? 200 : 503).json({
        status,
        components: {
            database: isMongoConnected ? "CONNECTED" : "DISCONNECTED",
        },
        timestamp: new Date().toISOString()
    });
});

const API_PREFIX = "/api/v1";

// Serve raw swagger spec
app.get(`${API_PREFIX}/swagger.json`, (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Serve unified swagger UI at /docs
const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        urls: [
            {
                url: `${API_PREFIX}/swagger.json`,
                name: "Main API"
            },
            {
                url: "/auth/swagger.json",
                name: "Auth Service"
            }
        ]
    }
};

app.use(`/docs`, swaggerUi.serve as any, swaggerUi.setup(null, swaggerOptions) as any);

// ----------------------
// 🔹 Dependency Injection
// ----------------------


// Initialize product repository and use case
const productRepo = new MongoProductRepository();
const productUseCase = new ProductUseCase(productRepo);
const productController = new ProductController(productUseCase);

// ----------------------
// 🔹 Routes (versioned)
// ----------------------
// Users / Auth


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


// Error Handling
app.use(errorHandler);

export { app };
