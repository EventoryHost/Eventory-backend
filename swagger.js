// root/swagger.js
import path from "path";
import { fileURLToPath } from "url";
import swaggerJSDoc from "swagger-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Eventory API Documentation",
      version: "1.0.0",
      description: "API documentation for Eventory backend",
    },
    servers: [
      {
        url: "http://localhost:4000", // Your base URL for local dev
      },
    ],
  },
  apis: [
    path.resolve(__dirname, "routes/**/*.js"), // scan everything in /routes recursively
    path.resolve(__dirname, "models/*.js"),             // <- Your models (if annotated)
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
