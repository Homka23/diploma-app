import { Router } from 'express';
import multer      from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { completeTab }                                          from '../controllers/lessons.js';
import { getLessonTheory }                                      from '../controllers/theory.js';
import { getLessonTest, submitTest }                             from '../controllers/test.js';
import { getLessonTranscription, submitTranscription, skipTranscription, getTranscriptionFeedback, getTranscriptionAttempts } from '../controllers/transcription.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get ('/:id/theory',                  requireAuth, getLessonTheory);
router.get ('/:id/test',                    requireAuth, getLessonTest);
router.post('/:id/test/submit',             requireAuth, submitTest);
router.post('/:id/complete/:tab',           requireAuth, completeTab);
router.get ('/:id/transcription',           requireAuth, getLessonTranscription);
router.post('/:id/transcription/submit',    requireAuth, upload.single('audio'), submitTranscription);
router.post('/:id/transcription/skip',      requireAuth, skipTranscription);
router.post('/:id/transcription/feedback',  requireAuth, getTranscriptionFeedback);
router.get ('/:id/transcription/attempts',  requireAuth, getTranscriptionAttempts);

export default router;
