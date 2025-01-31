import { Router } from "express";
import {
  addReviews,
  getService,
  getVendorLimit,
  handleSearch,
} from "../controllers/servicesController.js";
const serviceRouter = Router();

serviceRouter.get("/getServices/:vendortype/:vendorid", getService);
serviceRouter.get("/getService/:vendortype/:vendorid", getVendorLimit);
serviceRouter.post("/review", addReviews);
serviceRouter.get("/search", handleSearch);

export default serviceRouter;
