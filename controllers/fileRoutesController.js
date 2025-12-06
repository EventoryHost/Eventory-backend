import fetch from "node-fetch";

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
 * Controller: Get file info (name + size) from a given URL
 */
export const getFileInfo = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const fileName = getFileNameFromUrl(url);
    const fileSize = await getFileSizeFromUrl(url);
    return res.json({ fileName, fileSize });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
