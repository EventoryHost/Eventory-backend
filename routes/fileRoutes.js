import { Router } from "express";
import { getFileInfo } from "../controllers/fileRoutesController.js";

const router = Router();

/**
 * @swagger
 * /get-file-info:
 *   post:
 *     summary: Get file name and size from a given file URL
 *     tags: [Files]
 *     description: Returns the file name and size (in bytes) for a given URL.  
 *                  Works for publicly accessible URLs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://example.com/files/sample.pdf"
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                   example: "sample.pdf"
 *                 fileSize:
 *                   type: integer
 *                   example: 24567
 *       400:
 *         description: URL is required
 *       500:
 *         description: Failed to fetch file information
 */
router.post("/get-file-info", getFileInfo);

export default router;
