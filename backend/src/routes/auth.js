import { Router } from 'express';
import { register, login, googleAuth, forgotPassword, changePassword, ping, getMe, updateMe } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.post('/google',          googleAuth);
router.post('/forgot-password', forgotPassword);
router.put('/password',         requireAuth, changePassword);
router.patch('/ping',           requireAuth, ping);
router.get  ('/me',             requireAuth, getMe);
router.patch('/me',             requireAuth, updateMe);

export default router;
