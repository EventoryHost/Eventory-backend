import Redirect, { REDIRECT_DOC_ID } from "../models/redirect.js";

// GET /api/redirect
// Scanned by every printed QR card. Sends a 302 to whatever URL is currently
// stored in Mongo, so the printed code never has to change.
export const handleRedirect = async (req, res) => {
  try {
    const redirect = await Redirect.findById(REDIRECT_DOC_ID);

    if (!redirect || !redirect.destinationUrl) {
      return res.status(404).json({
        success: false,
        error: "Redirect destination not configured",
      });
    }

    // Discourage caching so a URL change takes effect on the very next scan.
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

    return res.redirect(302, redirect.destinationUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};
