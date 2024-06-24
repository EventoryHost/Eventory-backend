import { Router } from "express";
const router = Router();
import catererController from "../controllers/catererController.js";
import hallController from "../controllers/marraigeHallController.js";

router.get("/caterer", catererController.getAllCaterers);
router.post("/add-caterer", catererController.createCaterer);

router.get("/halls", hallController.getAllHalls);
router.post("/add-hall", hallController.createHall);

export default router;
