import pool from '../db/index.js';

export async function getLessonTheory(req, res) {
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { rows: lessonRows } = await pool.query(
    `SELECT l.id, l.title, l.description, t.title AS topic_title
     FROM lessons l JOIN topics t ON t.id = l.topic_id WHERE l.id = $1`,
    [lessonId],
  );
  if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });

  const { rows: blocks } = await pool.query(
    `SELECT lb.id AS block_id, lb.block_type, lb.title, lb.position,
            tb.content_json AS theory_content,
            sb.content_json AS staff_content, sb.audio_json AS staff_audio, sb.description AS staff_description,
            pb.content_json AS piano_content, pb.description  AS piano_description
     FROM lesson_blocks lb
     LEFT JOIN theory_blocks        tb ON tb.block_id = lb.id
     LEFT JOIN staff_example_blocks sb ON sb.block_id = lb.id
     LEFT JOIN piano_example_blocks pb ON pb.block_id = lb.id
     WHERE lb.lesson_id = $1 AND lb.tab_type = 'theory'
     ORDER BY lb.position`,
    [lessonId],
  );

  const theory = blocks.map(b => {
    if (b.block_type === 'theory')
      return { blockId: b.block_id, type: 'theory', title: b.title, position: b.position, content: b.theory_content };
    if (b.block_type === 'staff_example')
      return { blockId: b.block_id, type: 'staff_example', title: b.title, position: b.position, content: b.staff_content, audio: b.staff_audio, description: b.staff_description };
    if (b.block_type === 'piano_example')
      return { blockId: b.block_id, type: 'piano_example', title: b.title, position: b.position, content: b.piano_content, description: b.piano_description };
    return null;
  }).filter(Boolean);

  res.json({ lesson: lessonRows[0], theory });
}
