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
      const { rows: prev } = await pool.query(
        `SELECT theory_completed FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
        [userId, lessonId],
      );
      const alreadyDone = prev[0]?.theory_completed ?? false;
      await pool.query(
        `INSERT INTO user_lesson_progress (user_id, lesson_id, theory_completed, status)
         VALUES ($1, $2, true, 'available')
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET theory_completed = true`,
        [userId, lessonId],
      );
      if (!alreadyDone) {
        await pool.query('UPDATE users SET xp = xp + 20 WHERE id = $1', [userId]);
      }
    }
    await refreshProgress(userId, lessonId);
    res.json({ ok: true });
  } catch (err) {
    console.error('completeTab error:', err);
    res.status(500).json({ error: err.message });
  }
}
