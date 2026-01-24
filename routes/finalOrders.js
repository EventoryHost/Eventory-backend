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
  updateSpecificTerms,
  syncPaymentDetailsToEvents,
  deleteApprovalForOrder,
} from "../controllers/finalOrderController.js";

export default function finalOrdersRoutes(io) {
  const router = express.Router();

  // Middleware to attach io to all requests
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

router.post("/finalOrder", createOrUpdateFinalOrder);
router.get("/finalOrder", getAllFinalOrders);
router.get("/finalOrder/byQuotationId/:quotation_id", getOrderByQuotationId);
router.put("/finalOrder/approve", approveFinalOrder);
router.put("/finalOrder/:order_id", updateFinalOrder);
router.put("/finalOrder/:order_id/payment", updatePaymentDetails);
router.put("/finalOrder/:order_id/specific-terms", updateSpecificTerms);
router.put("/finalOrder/:order_id/sync-payment-to-events", syncPaymentDetailsToEvents);
router.get("/finalOrder/vendor/:vendor_id", getOrdersByVendor);
router.get("/finalOrder/customer/:customerId", getOrdersByCustomer);
router.get("/finalOrder/:order_id", getOrderById);
router.delete("/finalOrder/:order_id", deleteFinalOrder);
router.delete("/delete-approval", deleteApprovalForOrder);

  return router;
}
