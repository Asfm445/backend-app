import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { UserUseCase } from "../../usecase/user_usecase";
import { UserRegister } from "../../domain/models/user";

// ----------------------
// 🔹 Zod Schemas
// ----------------------
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(10, "Refresh token is required"),
});

const verifySchema = z.object({
    token: z.string().min(10, "Token is required"),
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
            const result = await this.userUseCase.register(userData);

            return res.status(201).json(result);
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
            const result = await this.userUseCase.login(parsed.email, parsed.password);

            return res.status(200).json(result);
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

    // ✅ Verify Token
    verify = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = verifySchema.parse(req.body);
            const decoded = this.userUseCase.verifyToken(parsed.token);

            if (!decoded) {
                return res.status(401).json({ valid: false });
            }

            return res.status(200).json({ valid: true, ...decoded });
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({ error: "Validation failed" });
            }
            return res.status(401).json({ valid: false });
        }
    };

    // ✅ Google OAuth method
    async loginOrRegisterGoogleUser(email: string, name: string, googleId: string) {
        const result = await this.userUseCase.loginOrRegisterGoogleUser(email, name, googleId);
        return result
    }
}
