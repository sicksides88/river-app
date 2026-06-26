import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMembership,
  setLinkType,
  saveAseguradora,
  saveIndependiente,
  completeOnboarding,
  setSubscription,
  cancelSubscription,
} from "../controllers/membership.controller.js";

const router = express.Router();
router.use(protect);

router.get("/", getMembership);
router.put("/link-type", setLinkType);
router.put("/aseguradora", saveAseguradora);
router.put("/independiente", saveIndependiente);
router.post("/complete", completeOnboarding);
router.put("/subscription", setSubscription);
router.post("/subscription/cancel", cancelSubscription);

export default router;
