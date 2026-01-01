import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Backend App API",
            version: "1.0.0",
            description: "Demo API for clean-architecture backend",
        },
        // NOTE: do NOT include the API prefix here — keep only the host/origin.
        servers: [
            {
                url: process.env.SWAGGER_BASE_URL ?? "http://localhost:4001",
                description: "API server (origin only)",
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
    apis: [
        "./src/api/controllers/*.ts",
        "./src/api/routes/*.ts",
        "./dist/src/api/controllers/*.js",
        "./dist/src/api/routes/*.js"
    ],
};

export const swaggerSpec = swaggerJSDoc(options);