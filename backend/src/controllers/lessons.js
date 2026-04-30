import pool from '../db/index.js';
import { refreshProgress } from '../helpers/progress.js';

export async function completeTab(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.id, 10);
  const { tab }  = req.params;

  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });
  if (!['theory', 'test', 'transcription'].includes(tab))
    return res.status(400).json({ error: 'Invalid tab' });

  try {
    if (tab === 'theory') {
      await pool.query(
        `INSERT INTO user_lesson_progress (user_id, lesson_id, theory_completed, status)
         VALUES ($1, $2, true, 'available')
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET theory_completed = true`,
        [userId, lessonId],
      );
    }
    await refreshProgress(userId, lessonId);
    res.json({ ok: true });
  } catch (err) {
    console.error('completeTab error:', err);
    res.status(500).json({ error: err.message });
  }
}
