import { Router } from "express";
const queryRoutes = Router();
import queryController from "../controllers2/queryController.js";

/**
 * @swagger
 * /create-query:
 *   post:
 *     summary: Create a general user query
 *     tags: [Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               message:
 *                 type: string
 *                 example: I have a question about your services.
 *     responses:
 *       201:
 *         description: Query created successfully
 */
queryRoutes.post("/create-query", queryController.createQuery);

/**
 * @swagger
 * /create-reachout-query:
 *   post:
 *     summary: Create a reach-out query for business collaboration or partnerships
 *     tags: [Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 example: jane@example.com
 *               company:
 *                 type: string
 *                 example: Example Corp
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               message:
 *                 type: string
 *                 example: We are interested in collaborating with your company.
 *     responses:
 *       201:
 *         description: Reach-out query created successfully
 */
queryRoutes.post("/create-reachout-query", queryController.createreachoutQuery);

export default queryRoutes;
