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
} from '../controllers/patrolShift.controller.js';

const router = Router();

router.get('/my-shift', protect, driverOnly, getMyShift);
router.get('/my-shifts', protect, driverOnly, getMyShifts);

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(authorize('admin', 'operator'));
adminRouter.get('/patrol-bases', listPatrolBases);
adminRouter.post('/patrol-bases', createPatrolBase);
adminRouter.get('/patrol-shifts', listPatrolShifts);
adminRouter.post('/patrol-shifts', createPatrolShift);
adminRouter.put('/patrol-shifts/:id', updatePatrolShift);

export { adminRouter as patrolAdminRoutes };
export default router;
