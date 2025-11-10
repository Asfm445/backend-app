import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodIssue } from "zod";
import { UserUseCase } from "../usecase/user_usecase";
import { User } from "../domain/models/user"; // adjust the path if needed

// ----------------------
// 🔹 Zod Schemas
// ----------------------
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
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
      const userData: User = {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      };

      // Call use case
      const message = await this.userUseCase.register(userData);

      return res.status(201).json({ message });
    } catch (err) {
      // Handle validation errors
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e: ZodIssue) => ({
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
      const message = await this.userUseCase.login(parsed.email, parsed.password);

      return res.status(200).json({ message });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e: ZodIssue) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      next(err);
    }
  };
}
