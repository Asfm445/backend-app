// ...existing code...
export class BadRequestError extends Error {
  public details?: any;
  constructor(message = "Bad Request", details?: any) {
    super(message);
    this.name = "BadRequestError";
    this.details = details;
    Error.captureStackTrace?.(this, BadRequestError);
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
    Error.captureStackTrace?.(this, NotFoundError);
  }
}

// ...existing code...