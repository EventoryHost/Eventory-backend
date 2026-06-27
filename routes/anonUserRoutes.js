import express from "express";
import {
  initializeAnonymousUser,
  updateAnonymousUserActivity,
} from "../controllers/anonymousUserController.js";

const router = express.Router();

router.post("/init", initializeAnonymousUser);
router.post("/:anon_user_id/heartbeat", updateAnonymousUserActivity);

export default router;
