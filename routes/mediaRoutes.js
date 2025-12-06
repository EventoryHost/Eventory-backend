import { Router } from "express";
import { getPresignedUrls } from "../controllers/mediaController.js";

const router = Router();

router.post("/presign", getPresignedUrls);

export default router;
