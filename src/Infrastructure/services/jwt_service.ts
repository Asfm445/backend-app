// src/core/services/jwt_service.ts
import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import { IJwtService } from "../../domain/interfaces/jwt_service";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Payload, Token, DecodedPayload } from "../../domain/models/user";
dotenv.config();

export class JwtService implements IJwtService {
  private accessSecret: Secret;
  private refreshSecret: Secret;
  private accessExpiry: string;
  private refreshExpiry: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || "access_secret_key";
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh_secret_key";
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRES || "15m"; // 15 minutes
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRES || "7d"; // 7 days
  }
  private parseExpiryToMs(expiry: string): number {
    const num = parseInt(expiry.slice(0, -1));
    const unit = expiry.slice(-1);

    switch (unit) {
      case "s":
        return num * 1000;
      case "m":
        return num * 60 * 1000;
      case "h":
        return num * 60 * 60 * 1000;
      case "d":
        return num * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }


  signAccessToken(payload: Payload): string {
    const options: SignOptions = { expiresIn: this.accessExpiry as any };

    return jwt.sign(payload, this.accessSecret, options);
  }

  signRefreshToken(payload: Payload): Token {
    const options: SignOptions = { expiresIn: this.refreshExpiry as any };
    const now = new Date();
    const expireAt = new Date(
      now.getTime() + this.parseExpiryToMs(this.refreshExpiry)
    );

    const token_id = uuidv4()

    const token = jwt.sign({ id: token_id, ...payload }, this.refreshSecret, options);
    return {
      id: token_id,
      userId: payload.userId,
      token: token,
      createdAt: now,
      expireAt: expireAt

    }
  }

  verifyAccessToken(token: string): DecodedPayload | null {
    try {
      return jwt.verify(token, this.accessSecret) as DecodedPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): DecodedPayload | null {
    try {
      return jwt.verify(token, this.refreshSecret) as DecodedPayload;
    } catch {
      return null;
    }
  }
}
