import express from "express";
import {
  createOrUpdateFinalOrder,
  getAllFinalOrders,
  getOrderByQuotationId,
  approveFinalOrder,
  updateFinalOrder,
  getOrdersByVendor,
  getOrdersByCustomer,
  getOrderById,
  deleteFinalOrder,
  updatePaymentDetails,
} from "../controllers2/finalOrderController.js";

const router = express.Router();

router.post("/finalOrder", createOrUpdateFinalOrder);
router.get("/finalOrder", getAllFinalOrders);
router.get("/finalOrder/byQuotationId/:quotation_id", getOrderByQuotationId);
router.put("/finalOrder/approve", approveFinalOrder);
router.put("/finalOrder/:order_id", updateFinalOrder);
router.put("/finalOrder/:order_id/payment", updatePaymentDetails);
router.get("/finalOrder/vendor/:vendor_id", getOrdersByVendor);
router.get("/finalOrder/customer/:customerId", getOrdersByCustomer);
router.get("/finalOrder/:order_id", getOrderById);
router.delete("/finalOrder/:order_id", deleteFinalOrder);

export default router;
