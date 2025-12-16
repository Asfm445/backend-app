// src/middleware/rateLimiter.ts

import { rateLimit } from 'express-rate-limit';

/**
 * General Rate Limiter: Allows many requests per IP to prevent basic DDoS/DoS.
 * Applied to: /register
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the headers (RateLimit-Limit, RateLimit-Remaining)
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

export const bruteForceRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: "Too many failed authentication attempts. Account access is temporarily blocked for 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});