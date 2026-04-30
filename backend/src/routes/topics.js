import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTopics } from '../controllers/topics.js';

const router = Router();

router.get('/', requireAuth, getTopics);

export default router;
