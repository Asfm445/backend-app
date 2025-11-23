import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend App API",
      version: "1.0.0",
      description: "Demo API for clean-architecture backend",
    },
    servers: [{ url: process.env.SWAGGER_BASE_URL ?? "http://localhost:4000" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter JWT token. Example: `eyJhbGciOiJI...` (no `Bearer ` prefix required in most UIs)",
        },
      },
    },
    // Optional: enable global security for all endpoints (can be overridden per-operation)
    // security: [{ BearerAuth: [] }],
  },
  apis: [
    "./src/api/controller.ts",
    "./src/api/routes/*.ts",
    "./src/api/controllers/*.ts",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);