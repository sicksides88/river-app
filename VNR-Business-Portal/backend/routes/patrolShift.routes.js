import { Router } from 'express';
import { protect, authorize, driverOnly } from '../middleware/auth.middleware.js';
import {
  getMyShift,
  getMyShifts,
  listPatrolBases,
  createPatrolBase,
  listPatrolShifts,
  createPatrolShift,
  updatePatrolShift,
  deletePatrolShift,
  updatePatrolBase,
  deletePatrolBase,
} from '../controllers/patrolShift.controller.js';

const router = Router();

router.get('/my-shift', protect, driverOnly, getMyShift);
router.get('/my-shifts', protect, driverOnly, getMyShifts);

const riverCrm = authorize('admin', 'operator', 'auditor');
const riverWrite = authorize('admin', 'operator');

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.get('/patrol-bases', riverCrm, listPatrolBases);
adminRouter.get('/patrol-shifts', riverCrm, listPatrolShifts);
adminRouter.post('/patrol-bases', riverWrite, createPatrolBase);
adminRouter.put('/patrol-bases/:id', riverWrite, updatePatrolBase);
adminRouter.delete('/patrol-bases/:id', riverWrite, deletePatrolBase);
adminRouter.post('/patrol-shifts', riverWrite, createPatrolShift);
adminRouter.put('/patrol-shifts/:id', riverWrite, updatePatrolShift);
adminRouter.delete('/patrol-shifts/:id', riverWrite, deletePatrolShift);

export { adminRouter as patrolAdminRoutes };
export default router;
