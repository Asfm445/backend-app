import { Request, Response, NextFunction } from "express";
import { BadRequestError, NotFoundError } from "../../domain/interfaces/Exceptions";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message || "Internal Server Error", {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
    });

    if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }

    if (err instanceof BadRequestError) {
        return res.status(400).json({ error: err.message, details: err.details });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.issues.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
        });
    }

    return res.status(500).json({ error: "Internal Server Error" });
};
