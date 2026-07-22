import express from "express";
const router = express.Router();
import * as redirectController from "../controllers/redirectController.js";

router.get("/", redirectController.handleRedirect);

export default router;
