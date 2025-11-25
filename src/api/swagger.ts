import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend App API",
      version: "1.0.0",
      description: "Demo API for clean-architecture backend",
    },
    servers: [
      {
        url: `${process.env.SWAGGER_BASE_URL ?? "http://localhost:4000"}/api/v1`,
        description: "API server (versioned)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste JWT token here (no 'Bearer ' prefix required)",
        },
      },
    },
  },
  apis: ["./src/api/controllers/*.ts", "./src/api/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);