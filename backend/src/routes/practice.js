import { Router } from 'express';
import multer      from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  getPracticeTranscriptions,
  getTasksForLesson,
  submitTaskAttempt,
  getTaskAttempts,
  getUserCoins,
  getTaskFeedback,
  getPracticeStats,
  submitPracticeTranscription,
  getPracticeAttempts,
} from '../controllers/practice.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Task bank
router.get ('/transcription',                    requireAuth, getPracticeTranscriptions);
router.get ('/tasks',                            requireAuth, getTasksForLesson);
router.post('/tasks/:taskId/submit',             requireAuth, upload.single('audio'), submitTaskAttempt);
router.get ('/tasks/:taskId/attempts',           requireAuth, getTaskAttempts);
router.get ('/coins',                            requireAuth, getUserCoins);
router.get ('/stats',                            requireAuth, getPracticeStats);
router.post('/tasks/:taskId/feedback',           requireAuth, getTaskFeedback);

// Legacy (returns 410)
router.post('/transcription/:lessonId/submit',   requireAuth, upload.single('audio'), submitPracticeTranscription);
router.get ('/transcription/:lessonId/attempts', requireAuth, getPracticeAttempts);

export default router;
