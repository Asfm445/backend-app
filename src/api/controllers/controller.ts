import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { UserUseCase } from "../../usecase/user_usecase";
import { UserRegister } from "../../domain/models/user";

// ----------------------
// 🔹 Zod Schemas - FIXED
// ----------------------
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.email("Invalid email format"), // Fixed: z.email() doesn't exist
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.email("Invalid email format"), // Fixed: z.email() doesn't exist
  password: z.string().min(1, "Password is required"), // Fixed: Changed to min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, "Refresh token is required"),
});

// ----------------------
// 🔹 Controller Class
// ----------------------
export class UserController {
  private userUseCase: UserUseCase;

  constructor(userUseCase: UserUseCase) {
    this.userUseCase = userUseCase;
  }

  // ✅ Register user
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate incoming data
      const parsed = registerSchema.parse(req.body);

      // Convert to domain User type
      const userData: UserRegister = {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      };

      // Call use case
      const result = await this.userUseCase.register(userData); // Fixed: Changed to 'result' to handle tokens

      return res.status(201).json(result); // Fixed: Return the actual result
    } catch (err) {
      // Handle validation errors
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      // Pass unknown errors to global handler
      next(err);
    }
  };

  // ✅ Login user
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate incoming data
      const parsed = loginSchema.parse(req.body);

      // Call use case with validated data
      const result = await this.userUseCase.login(parsed.email, parsed.password); // Fixed: Changed to 'result'

      return res.status(200).json(result); // Fixed: Return the actual result with tokens
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = refreshSchema.parse(req.body);
      const newTokens = await this.userUseCase.refreshToken(parsed.refreshToken);

      return res.status(200).json(newTokens);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };

  // ✅ Google OAuth method
  async loginOrRegisterGoogleUser(email: string, name: string, googleId: string) {
    const result=await this.userUseCase.loginOrRegisterGoogleUser(email, name, googleId);
    return result
  }
}

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *              
  max: 100, // Limit each IP to   type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       "201":
 *         description: User created
 *       "400":
 *         description: Validation or bad request
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user and get tokens
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Tokens returned
 *       "400":
 *         description: Invalid credentials
 */

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: New tokens returned
 *       "400":
 *         description: Invalid or missing refresh token
 *       "401":
 *         description: Refresh token expired or invalid
 */