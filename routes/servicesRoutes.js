import { Router } from "express";
import { getService } from "../controllers/servicesController.js"
const serviceRouter = Router();


serviceRouter.get("/getServices/:vendortype/:vendorid", getService);

export default serviceRouter;