import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createAuxilio,
  listAuxilios,
  getAuxilio,
  cancelAuxilio,
  acceptAuxilio,
  rejectAuxilio,
  updateAuxilioStatus,
  reportAuxilio,
  uploadAuxilioPhoto,
  saveAuxilioSignature,
} from "../controllers/auxilio.controller.js";

const router = express.Router();
router.use(protect);

router.post("/", createAuxilio);
router.get("/", listAuxilios);
router.get("/:id", getAuxilio);
router.put("/:id/cancel", cancelAuxilio);
router.put("/:id/accept", acceptAuxilio);
router.put("/:id/reject", rejectAuxilio);
router.put("/:id/status", updateAuxilioStatus);
router.post("/:id/report", reportAuxilio);
router.post("/:id/photos", uploadAuxilioPhoto);
router.post("/:id/signature", saveAuxilioSignature);

export default router;
