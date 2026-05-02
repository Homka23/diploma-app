import pool from '../db/index.js';

export async function getTopics(req, res) {
  const userId = req.user.userId;

  const { rows } = await pool.query(
    `SELECT
       t.id             AS topic_id,
       t.title          AS topic_title,
       t.description    AS topic_description,
       t.position       AS topic_position,
       t.force_unlock   AS topic_force_unlock,
       COALESCE(utp.progress_percent, 0)      AS topic_progress,
       COALESCE(utp.status, 'available')      AS topic_status,
       l.id             AS lesson_id,
       l.title          AS lesson_title,
       l.position       AS lesson_position,
       l.force_unlock   AS lesson_force_unlock,
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
        id:           row.topic_id,
        title:        row.topic_title,
        description:  row.topic_description,
        progress:     Number(row.topic_progress),
        forceUnlock:  row.topic_force_unlock,
        locked:       row.topic_status === 'locked',
        lessons:      [],
      });
    }

    if (row.lesson_id !== null) {
      topicsMap.get(row.topic_id).lessons.push({
        id:            row.lesson_id,
        title:         row.lesson_title,
        theory:        row.theory_completed,
        test:          row.test_completed,
        transcription: row.transcription_completed,
        forceUnlock:   row.lesson_force_unlock,
        locked:        false,
      });
    }
  }

  // Compute locking dynamically based on completion order
  const topicsArr = [...topicsMap.values()];
  for (let i = 0; i < topicsArr.length; i++) {
    if (topicsArr[i].forceUnlock) {
      topicsArr[i].locked = false;
    } else if (i === 0) {
      topicsArr[i].locked = false;
    } else {
      const prev = topicsArr[i - 1];
      const prevDone = prev.lessons.length > 0 && prev.lessons.every(l => l.theory && l.test && l.transcription);
      topicsArr[i].locked = !prevDone;
    }

    const topic = topicsArr[i];
    for (let j = 0; j < topic.lessons.length; j++) {
      if (topic.lessons[j].forceUnlock) {
        topic.lessons[j].locked = false;
      } else if (topic.locked || j === 0) {
        topic.lessons[j].locked = topic.locked;
      } else {
        const prevLesson = topic.lessons[j - 1];
        topic.lessons[j].locked = !(prevLesson.theory && prevLesson.test && prevLesson.transcription);
      }
    }
  }

  res.json(topicsArr);
}
