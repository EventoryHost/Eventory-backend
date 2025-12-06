import express from "express";
import {
  updatePageNumber,
  getLastPageNumber,
} from "../controllers/updatePageController.js";

const router = express.Router();

router.put("/:flowType/updatePageNumber/:vendor_id", updatePageNumber);
router.get("/:flowType/getLastPageNumber/:vendor_id", getLastPageNumber);

export default router;
