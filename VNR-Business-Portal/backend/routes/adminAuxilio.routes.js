import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  listAdminAuxilios,
  getAdminAuxilio,
  createAdminAuxilio,
  assignAdminAuxilio,
  setAdminAuxilioPriority,
  listPatrolsOnDuty,
} from '../controllers/adminAuxilio.controller.js';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'operator'));

router.get('/auxilios', listAdminAuxilios);
router.get('/auxilios/:id', getAdminAuxilio);
router.post('/auxilios', createAdminAuxilio);
router.put('/auxilios/:id/assign', assignAdminAuxilio);
router.put('/auxilios/:id/priority', setAdminAuxilioPriority);
router.get('/patrols/on-duty', listPatrolsOnDuty);

export default router;
