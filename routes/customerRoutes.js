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
  getFavoriteServiceIds,
  getCustomerNotifications,
  markNotificationAsRead
} from "../controllers/customerController.js";
const router = express.Router();

router.post("/add-customer", addCustomer);
router.get("/get-customer", getCustomer);
router.get("/get-booking/:cusId/:serId", getBooking);
router.get("/add-fav/:cusId/:serId", addFavourite);
router.get("/get-fav/:cusId", getFavoriteServices);
router.get("/get-fav-id/:cusId", getFavoriteServiceIds);
router.get("/remove-fav/:cusId/:serId", removeFavourite);
router.get("/get-customer/:mobile", getCustomerByMobile);
router.put("/update-customer", updateCustomer);
router.get("/notifications/:customerId" , getCustomerNotifications);
router.patch("/notifications/read/:notificationId", markNotificationAsRead);




export default router;
