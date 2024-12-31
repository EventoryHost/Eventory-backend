import express from "express";
import {
  removeFavourite,
} from "../controllers/customerController.js";
const router = express.Router();
router.get("/:type/:serId", removeFavourite);

export default router;
