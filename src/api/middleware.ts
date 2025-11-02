import morgan from "morgan";
import { Request, Response, NextFunction } from "express";
import { httpDebug } from "../utils/logger";
import {
  BadRequestError,
  NotFoundError,
} from "../domain/interfaces/Exceptions";

// HTTP request logger using morgan but writing to debug stream
export const requestLogger = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  {
    stream: { write: (s: string) => httpDebug(s.trim()) },
  }
);

// response timing logger (adds precise timing and compact message)
export function responseLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  res.on("finish", () => {
    const [s, ns] = process.hrtime(start);
    const ms = (s * 1e3 + ns / 1e6).toFixed(2);
    httpDebug(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms} ms`);
  });
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Map domain errors to HTTP status codes here
  let status = 500;
  let message = err?.message ?? "Internal Server Error";
  const payload: Record<string, any> = {};

  if (err instanceof BadRequestError) {
    status = 400;
    if ((err as any).details) payload.details = (err as any).details;
  } else if (err instanceof NotFoundError) {
    status = 404;
  } else if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    // body-parser / JSON parse errors
    status = 400;
    message = "Invalid JSON payload";
  }

  // Optional server-side logging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message,
    status,
    stack: err?.stack,
    details: payload.details,
  });

  res.status(status).json({ error: message, ...payload });
}