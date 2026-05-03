import { Router } from 'express';
import multer      from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { getPracticeTranscriptions, submitPracticeTranscription, getPracticeAttempts } from '../controllers/practice.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get ('transcription',                          requireAuth, getPracticeTranscriptions);
router.post('transcription/:lessonId/submit',         requireAuth, upload.single('audio'), submitPracticeTranscription);
router.get ('transcription/:lessonId/attempts',       requireAuth, getPracticeAttempts);

export default router;
