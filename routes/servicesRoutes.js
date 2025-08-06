import { Router } from "express";
import {
  addReviews,
  getService,
  getServiceByServiceId,
  getVendorLimit,
  handleSearch,
} from "../controllers/servicesController.js";
const serviceRouter = Router();

serviceRouter.get("/getServices/:vendortype/:vendorid", getService);
serviceRouter.get("/getService/:vendortype/:vendorid", getVendorLimit);
serviceRouter.post("/review", addReviews);
serviceRouter.get("/search", handleSearch);
serviceRouter.get("/get-service/:serviceType/:serviceId", getServiceByServiceId);

export default serviceRouter;
