//backend/src/helpers/progress.js
import pool from '../db/index.js';

// Recalculates lesson progress_percent and topic progress_percent for a user.
export async function refreshProgress(userId, lessonId) {
  await pool.query(
    `UPDATE user_lesson_progress
     SET progress_percent = ROUND(
       (CASE WHEN theory_completed        THEN 1 ELSE 0 END +
        CASE WHEN test_completed          THEN 1 ELSE 0 END +
        CASE WHEN transcription_completed THEN 1 ELSE 0 END)::numeric / 3 * 100, 2)
     WHERE user_id = $1 AND lesson_id = $2`,
    [userId, lessonId],
  );

  const { rows } = await pool.query(
    `SELECT topic_id FROM lessons WHERE id = $1`, [lessonId],
  );
  if (!rows.length) return;

  await pool.query(
    `INSERT INTO user_topic_progress (user_id, topic_id, progress_percent, status)
     SELECT $1, $2,
       ROUND(COALESCE(
         SUM(CASE WHEN ulp.theory_completed AND ulp.test_completed AND ulp.transcription_completed THEN 1 ELSE 0 END)::numeric
         / NULLIF(COUNT(l.id), 0) * 100, 0), 2),
       'available'
     FROM lessons l
     LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = l.id AND ulp.user_id = $1
     WHERE l.topic_id = $2
     ON CONFLICT (user_id, topic_id) DO UPDATE SET progress_percent = EXCLUDED.progress_percent`,
    [userId, rows[0].topic_id],
  );
}
