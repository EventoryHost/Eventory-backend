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
        url: "http://localhost:4000",
      },
      {
        url: "https://api.eventory.in",
        description: "Production server",
      },
    ],
  },
  apis: [
    path.resolve(__dirname, "routes/**/*.js"),           
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
