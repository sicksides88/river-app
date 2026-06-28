import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getUsers,
  getUserById,
  createAdminUser,
  updateUser,
  deleteUser,
  getUserStats,
  searchUsersForAlta,
  searchPatronsForShift,
  getUserVesselsForAdmin,
  createAdminVessel,
  updateAdminVessel,
  deleteAdminVessel,
  importNavigatorsCSV,
  exportUsersReport,
  listPatrolVessels,
  createPatrolVessel,
  updatePatrolVessel,
  deletePatrolVessel,
  listCrmStaff,
  createCrmStaff,
} from "../controllers/usersAdmin.controller.js";
import { exportAuxiliosReport } from "../controllers/riverReports.controller.js";

const router = express.Router();
const riverCrm = authorize("admin", "operator", "auditor");
const riverWrite = authorize("admin", "operator");

router.use(protect);

router.get("/users/search", riverCrm, searchUsersForAlta);
router.get("/patrons/search", riverCrm, searchPatronsForShift);
router.get("/reports/auxilios", riverCrm, exportAuxiliosReport);
router.get("/patrol-vessels", riverCrm, listPatrolVessels);
router.get("/staff", authorize("admin"), listCrmStaff);
router.post("/staff", authorize("admin"), createCrmStaff);

router.get("/users/export", riverCrm, exportUsersReport);

router.get("/users/stats", authorize("admin"), getUserStats);

router.get("/users", riverCrm, getUsers);
router.post("/users", riverWrite, createAdminUser);
router.post("/users/import", riverWrite, importNavigatorsCSV);
router.get("/users/:id/vessels", riverCrm, getUserVesselsForAdmin);
router.post("/users/:id/vessels", riverWrite, createAdminVessel);
router.post("/drivers/:id/patrol-vessels", riverWrite, createPatrolVessel);
router.get("/users/:id", riverCrm, getUserById);
router.put("/users/:id", riverWrite, updateUser);
router.put("/vessels/:id", riverWrite, updateAdminVessel);
router.put("/patrol-vessels/:id", riverWrite, updatePatrolVessel);
router.delete("/vessels/:id", riverWrite, deleteAdminVessel);
router.delete("/patrol-vessels/:id", riverWrite, deletePatrolVessel);

router.delete("/users/:id", authorize("admin"), deleteUser);

export default router;
