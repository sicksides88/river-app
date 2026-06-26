import express from "express";
import {
  validateCoupon,
  applyCoupon
} from "../controllers/coupon.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/validate", validateCoupon);
router.post("/apply", applyCoupon);

export default router;
