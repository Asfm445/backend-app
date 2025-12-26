import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { MongoUserRepository } from "../Infrastructure/MongoUserRepository";
import { UserUseCase } from "../usecase/user_usecase";
import { UserController } from "./controller";
import { JwtService } from "../Infrastructure/services/jwt_service";
import { BcryptPasswordHasher } from "../Infrastructure/services/password_hasher";
import { errorHandler, requestLogger, responseLogger } from "./middleware";
import { createGoogleAuthRouter } from "./routes/googleAuth";
import { typeDefs } from "./graphql/schema";
import { resolvers, GraphqlContext } from "./graphql/resolvers";
import { setupSwagger } from "./swagger";

dotenv.config();

async function startServer() {
  const app = express();

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
  // 🔹 Apollo Server Setup
  // ----------------------
  const server = new ApolloServer<GraphqlContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  // ----------------------
  // 🔹 Middlewares
  // ----------------------
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use(responseLogger);

  // ----------------------
  // 🔹 Swagger API Docs
  // ----------------------
  setupSwagger(app);

  // ----------------------
  // 🔹 GraphQL Endpoint
  // ----------------------
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        let userId: string | undefined;
        let role: string | undefined;

        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          try {
            const decoded = jwtService.verifyAccessToken(token) as any;
            userId = decoded.userId;
            role = decoded.role;
          } catch (err) {
            // Silently fail or log, depending on whether the entire API or just some fields are protected
          }
        }
        return { userUseCase, userId, role };
      },
    })
  );

  // ----------------------
  // 🔹 REST Routes (Keep existing)
  // ----------------------
  app.post("/register", userController.register);
  app.post("/login", userController.login);
  app.post("/refresh", userController.refreshToken);
  app.get("/health", (req, res) => res.json({ status: "ok" }));

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
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}/graphql`)
  );
}

startServer().catch((err) => {
  console.error("error starting server", err);
});