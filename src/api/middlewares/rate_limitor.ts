// src/middleware/rateLimiter.ts

import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * General Rate Limiter: Allows many requests per IP to prevent basic DDoS/DoS.
 * Applied to: /register
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // Increased limit for load testing
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the headers (RateLimit-Limit, RateLimit-Remaining)
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  store: new RedisStore({
    // @ts-expect-error - Known compatibility issue between ioredis and rate-limit-redis types
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});

export const bruteForceRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: "Too many failed authentication attempts. Account access is temporarily blocked for 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known compatibility issue between ioredis and rate-limit-redis types
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});