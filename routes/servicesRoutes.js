import { Router } from "express";
import { addReviews, getService } from "../controllers/servicesController.js";
const serviceRouter = Router();

serviceRouter.get("/getServices/:vendortype/:vendorid", getService);
router.post("/review", addReviews);

export default serviceRouter;
