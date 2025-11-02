import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { InMemoryUserRepository } from "../Infrastructure/repo";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controller";
import { User } from "../domain/models/user";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { log } from "../api/utils/logger";

const app = express();

// enable DEBUG logs by setting DEBUG env var when running, e.g.:
// DEBUG=app:* npm run dev
log.info("starting app");

// use morgan-based request logger and response timing logger
app.use(requestLogger);
app.use(responseLogger);

app.use(bodyParser.json());

// Dependency injection setup
const db: User[] = [];
const userRepo = new InMemoryUserRepository(db);
const userUseCase = new UserUseCase(userRepo);
const userController = new UserController(userUseCase);

// Routes
app.post("/register", userController.register);
app.post("/login", userController.login);
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

// Start server
app.listen(3000, () => {
  log.info("🚀 Server running on http://localhost:3000");
});
