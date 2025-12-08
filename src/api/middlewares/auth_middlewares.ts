// src/middleware/auth_middleware.ts
import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../Infrastructure/services/jwt_service";

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

// Factory function to create middleware with allowed roles
export const authenticate = (allowedRoles: string[]) => {
  console.log("+++++++++++++++++++++++++++++ auth middleware factory ++++++++++++++++++++++++++++", allowedRoles);
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access token required" });
      }
      console.log("+++++++++++++++++++++++++++++ auth middleware ++++++++++++++++++++++++++++");

      const token = authHeader.split(" ")[1];
      const jwtService = new JwtService();

      // Verify token
      const decoded = jwtService.verifyAccessToken(token) as any;

      if (!decoded) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Check role
      console.log(allowedRoles, decoded.role,decoded)
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" });
      }

      // Attach user payload to request
      req.user = { userId: decoded.userId, role: decoded.role };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};
