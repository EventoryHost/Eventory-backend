import { Router } from "express";
import fetch from "node-fetch";
const router = Router();

/**
 * Extracts file name from a given URL
 * @param {string} url
 * @returns {string} file name
 */
function getFileNameFromUrl(url) {
  const decodedUrl = decodeURIComponent(url);
  const pathParts = decodedUrl.split("/");
  return pathParts[pathParts.length - 1];
}

/**
 * Fetches file size from a given URL using HTTP HEAD request
 * @param {string} url
 * @returns {Promise<number>} file size in bytes
 */
async function getFileSizeFromUrl(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) throw new Error("Failed to fetch file info");
    return parseInt(response.headers.get("content-length")) || 0;
  } catch (error) {
    throw new Error(`Error fetching file size: ${error.message}`);
  }
}

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
router.post("/get-file-info", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const fileName = getFileNameFromUrl(url);
    const fileSize = await getFileSizeFromUrl(url);
    return res.json({ fileName, fileSize });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
