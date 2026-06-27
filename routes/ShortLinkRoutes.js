import express from "express";
const router = express.Router();
import * as shortLinkController from "../controllers/ShortLinkController.js";

router.post("/create", shortLinkController.createShortLink);
router.get("/:code", shortLinkController.getShortLink);

export default router;
