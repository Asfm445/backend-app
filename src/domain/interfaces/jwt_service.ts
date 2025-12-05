// src/core/services/jwt_service_interface.ts

import { Token, DecodedPayload } from "../models/user";

export interface IJwtService {
  signAccessToken(payload: object): string;
  signRefreshToken(payload: object): Token;
  verifyAccessToken(token: string): DecodedPayload | null;
  verifyRefreshToken(token: string): DecodedPayload | null;
}
