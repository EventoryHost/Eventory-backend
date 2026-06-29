import express from "express";
import {
  createOrUpdateAnonOrder,
  getAllAnonOrders,
  getAnonOrderById,
  getAnonOrderByChatId,
  updateAnonOrder,
  deleteAnonOrder,
  convertAnonOrder,
} from "../controllers/anonOrderController.js";

export default function anonOrderRoutes(io) {
  const router = express.Router();

  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  router.post("/", createOrUpdateAnonOrder);

  router.get("/", getAllAnonOrders);

  router.get("/by-chat/:chat_id", getAnonOrderByChatId);

  router.get("/:anon_order_id", getAnonOrderById);

  router.put("/:anon_order_id", updateAnonOrder);

  router.delete("/:anon_order_id", deleteAnonOrder);

  router.post("/:anon_order_id/convert", convertAnonOrder);

  return router;
}
