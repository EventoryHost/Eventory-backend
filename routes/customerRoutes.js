import express from "express";
import {
  addCustomer,
  getCustomer,
  getBooking,
  addFavourite,
  getFavoriteServices,
  removeFavourite,
  getCustomerByMobile,
  updateCustomer,
} from "../controllers/customerController.js";
const router = express.Router();

router.post("/add-customer", addCustomer);
router.get("/get-customer", getCustomer);
router.get("/get-booking/:cusId/:serId", getBooking);
router.get("/add-fav/:cusId/:serId", addFavourite);
router.get("/get-fav/:cusId", getFavoriteServices);
router.get("/remove-fav/:cusId/:serId", removeFavourite);
router.get("/get-customer/:mobile", getCustomerByMobile);
router.put("/update-customer", updateCustomer);

export default router;
