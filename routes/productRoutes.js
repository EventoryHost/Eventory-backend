import { Router } from "express";
import catererController from "../controllers/products/catererController.js";
import upload from "../middlewares/uploads.js";
import venueController from "../controllers/products/venueController.js";

const router = Router();

router.get("/caterer", catererController.getAllCaterers);
router.post(
  "/add-caterer",
  upload("Caterers").fields([
    { name: "menu", maxCount: 1 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  catererController.createCaterer
);

router.post(
  "/add-venue",
  upload("Venues").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  venueController.createVenue
);

export default router;
