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

const riverCrm = authorize('admin', 'operator', 'auditor');
const riverWrite = authorize('admin', 'operator');

router.use(protect);

router.get('/auxilios', riverCrm, listAdminAuxilios);
router.get('/auxilios/:id', riverCrm, getAdminAuxilio);
router.get('/patrols/on-duty', riverCrm, listPatrolsOnDuty);
router.post('/auxilios', riverWrite, createAdminAuxilio);
router.put('/auxilios/:id/assign', riverWrite, assignAdminAuxilio);
router.put('/auxilios/:id/priority', riverWrite, setAdminAuxilioPriority);

export default router;
