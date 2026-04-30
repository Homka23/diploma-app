import pool from '../db/index.js';

export async function getTopics(req, res) {
  const userId = req.user.userId;

  const { rows } = await pool.query(
    `SELECT
       t.id             AS topic_id,
       t.title          AS topic_title,
       t.description    AS topic_description,
       t.position       AS topic_position,
       COALESCE(utp.progress_percent, 0)      AS topic_progress,
       COALESCE(utp.status, 'available')      AS topic_status,
       l.id             AS lesson_id,
       l.title          AS lesson_title,
       l.position       AS lesson_position,
       COALESCE(ulp.theory_completed,        false) AS theory_completed,
       COALESCE(ulp.test_completed,          false) AS test_completed,
       COALESCE(ulp.transcription_completed, false) AS transcription_completed
     FROM topics t
     LEFT JOIN user_topic_progress  utp ON utp.topic_id  = t.id  AND utp.user_id  = $1
     LEFT JOIN lessons               l   ON l.topic_id   = t.id
     LEFT JOIN user_lesson_progress  ulp ON ulp.lesson_id = l.id  AND ulp.user_id  = $1
     ORDER BY t.position, l.position`,
    [userId],
  );

  // Group flat rows into nested topic → lessons structure
  const topicsMap = new Map();

  for (const row of rows) {
    if (!topicsMap.has(row.topic_id)) {
      topicsMap.set(row.topic_id, {
        id:          row.topic_id,
        title:       row.topic_title,
        description: row.topic_description,
        progress:    Number(row.topic_progress),
        locked:      row.topic_status === 'locked',
        lessons:     [],
      });
    }

    if (row.lesson_id !== null) {
      topicsMap.get(row.topic_id).lessons.push({
        id:            row.lesson_id,
        title:         row.lesson_title,
        theory:        row.theory_completed,
        test:          row.test_completed,
        transcription: row.transcription_completed,
      });
    }
  }

  res.json([...topicsMap.values()]);
}
