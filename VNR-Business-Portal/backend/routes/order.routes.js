import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);

export default router;
