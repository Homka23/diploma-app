import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPracticeTranscriptions } from '../controllers/practice.js';

const router = Router();

router.get('/transcription', requireAuth, getPracticeTranscriptions);

export default router;
