import pool from '../db/index.js';

export async function getPracticeTranscriptions(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT t.id   AS topic_id,   t.title AS topic_title,   t.position AS topic_position,
              l.id   AS lesson_id,  l.title AS lesson_title,  l.position AS lesson_position
       FROM topics t
       JOIN lessons l              ON l.topic_id  = t.id
       JOIN lesson_blocks lb       ON lb.lesson_id = l.id AND lb.tab_type = 'transcription'
       JOIN transcription_blocks tb ON tb.block_id  = lb.id
       ORDER BY t.position, l.position`,
    );

    const topicsMap = new Map();
    for (const row of rows) {
      if (!topicsMap.has(row.topic_id)) {
        topicsMap.set(row.topic_id, {
          id:      row.topic_id,
          title:   row.topic_title,
          lessons: [],
        });
      }
      topicsMap.get(row.topic_id).lessons.push({
        id:    row.lesson_id,
        title: row.lesson_title,
      });
    }

    res.json([...topicsMap.values()]);
  } catch (err) {
    console.error('getPracticeTranscriptions error:', err);
    res.status(500).json({ error: err.message });
  }
}
