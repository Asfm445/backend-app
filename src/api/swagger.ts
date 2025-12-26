import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Backend App API",
            version: "1.0.0",
            description: "API documentation for the Backend App (REST + GraphQL)",
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/api/*.ts", "./src/api/routes/*.ts"], // Path to the API docs
};

const specs = swaggerJsDoc(options);

export const setupSwagger = (app: Express) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
    console.log("📝 Swagger documentation available at http://localhost:4000/api-docs");
};
