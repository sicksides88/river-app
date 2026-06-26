import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listVessels,
  getVessel,
  createVessel,
  updateVessel,
  deleteVessel,
} from "../controllers/vessel.controller.js";

const router = express.Router();
router.use(protect);

router.get("/", listVessels);
router.post("/", createVessel);
router.get("/:id", getVessel);
router.put("/:id", updateVessel);
router.delete("/:id", deleteVessel);

export default router;
