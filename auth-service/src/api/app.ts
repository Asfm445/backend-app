import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { MongoUserRepository } from "../infrastructure/repositories/MongoUserRepository";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controllers/user_controller";
import { JwtService } from "../infrastructure/services/jwt_service";
import { BcryptPasswordHasher } from "../infrastructure/services/password_hasher";
import { createAuthRouter } from "./routes/auth_routes";
import { createGoogleAuthRouter } from "./routes/google_auth";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { errorHandler } from "./middlewares/error_handler";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.get("/auth/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});
app.use("/docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
// Dependencies
const userRepo = new MongoUserRepository();
const jwtService = new JwtService();
const passHasher = new BcryptPasswordHasher();
const userUseCase = new UserUseCase(userRepo, jwtService, passHasher);
const userController = new UserController(userUseCase);

// Routes
const authRouter = createAuthRouter(userController);
const googleAuthRouter = createGoogleAuthRouter(userController);

app.use("/auth", authRouter);
app.use("/auth", googleAuthRouter);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", service: "auth-service" });
});

app.use(errorHandler);

export { app };
