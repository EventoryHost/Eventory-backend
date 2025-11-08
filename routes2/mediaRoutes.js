import { Router } from "express";
import { getPresignedUrls } from "../controllers2/mediaController.js";

const router = Router();

router.post("/presign", getPresignedUrls);

export default router;
