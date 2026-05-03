import fs   from 'fs';
import pool from '../db/index.js';

// ── Scoring helpers ───────────────────────────────────────────────────────────

function beatMultiplierFor(ts) {
  if (!ts) return 1;
  const [, bottom] = ts.split('/').map(Number);
  if (bottom === 8) return 1.5;
  if (bottom === 2) return 2;
  return 1;
}
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function evaluateDurations(notes, expected, expectedRatios, timeSignature) {
  if (!expectedRatios) return { noteDurations: expected.map(() => ({ expectedRatio: null, expected: null, recognized: null, match: null })), durationScore: null, beatUnit: null };
  const bm     = beatMultiplierFor(timeSignature);
  const paired = expectedRatios.map((r, i) => notes[i]?.duration != null ? { ratio: r * bm, dur: notes[i].duration } : null).filter(Boolean);
  const beatUnit = paired.length > 0 ? median(paired.map(p => p.dur / p.ratio)) : 1;
  const noteDurations = expected.map((_, i) => {
    const ratio = expectedRatios[i] ?? null;
    const recDur = notes[i]?.duration ?? null;
    const expDur = ratio != null ? parseFloat((ratio * bm * beatUnit).toFixed(2)) : null;
    const match = expDur != null && recDur != null ? Math.abs(recDur - expDur) / expDur <= 0.2 : null;
    return { expectedRatio: ratio, expected: expDur, recognized: recDur != null ? parseFloat(recDur.toFixed(2)) : null, match };
  });
  const durationScore = Math.round(noteDurations.filter(d => d.match === true).length / expected.length * 100);
  return { noteDurations, durationScore, beatUnit: parseFloat(beatUnit.toFixed(3)) };
}

const COINS_PER_PASS = 10;

// ── GET /api/practice/transcription ──────────────────────────────────────────

export async function getPracticeTranscriptions(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT t.id AS topic_id, t.title AS topic_title, t.position AS topic_position,
              l.id AS lesson_id, l.title AS lesson_title, l.position AS lesson_position,
              COUNT(pt.id)::int AS task_count
       FROM topics t
       JOIN lessons l ON l.topic_id = t.id
       LEFT JOIN practice_tasks pt ON pt.lesson_id = l.id
       GROUP BY t.id, t.title, t.position, l.id, l.title, l.position
       HAVING COUNT(pt.id) > 0
       ORDER BY t.position, l.position`,
    );
    const topicsMap = new Map();
    for (const row of rows) {
      if (!topicsMap.has(row.topic_id)) {
        topicsMap.set(row.topic_id, { id: row.topic_id, title: row.topic_title, lessons: [] });
      }
      topicsMap.get(row.topic_id).lessons.push({ id: row.lesson_id, title: row.lesson_title, taskCount: row.task_count });
    }
    res.json([...topicsMap.values()]);
  } catch (err) {
    console.error('getPracticeTranscriptions error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/practice/tasks?lessonId=:id ─────────────────────────────────────

export async function getTasksForLesson(req, res) {
  const lessonId = parseInt(req.query.lessonId, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Missing lessonId' });
  const { rows } = await pool.query(
    `SELECT id, title, instruction_text, expected_json, position
     FROM practice_tasks WHERE lesson_id = $1 ORDER BY position, id`,
    [lessonId],
  );
  res.json({ tasks: rows });
}

// ── POST /api/practice/tasks/:taskId/submit ───────────────────────────────────

export async function submitTaskAttempt(req, res) {
  const userId = req.user.userId;
  const taskId = parseInt(req.params.taskId, 10);
  if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task id' });
  if (!req.file)     return res.status(400).json({ error: 'No audio file' });

  const filePath = req.file.path;
  try {
    const { rows: taskRows } = await pool.query(
      'SELECT id, expected_json FROM practice_tasks WHERE id = $1',
      [taskId],
    );
    if (!taskRows.length) return res.status(404).json({ error: 'Task not found' });
    const task = taskRows[0];

    const formData = new FormData();
    formData.append('audio', new Blob([fs.readFileSync(filePath)]), req.file.originalname || 'audio.webm');
    const pyRes = await fetch(`${process.env.TRANSCRIPTION_SERVICE_URL ?? 'http://localhost:5001'}/transcribe`, { method: 'POST', body: formData });
    if (!pyRes.ok) return res.status(500).json({ error: 'Transcription service error' });
    const { notes } = await pyRes.json();

    const expected       = task.expected_json?.notes         ?? [];
    const expectedRatios = task.expected_json?.durations     ?? null;
    const timeSignature  = task.expected_json?.timeSignature ?? null;
    const recognized     = notes.map(n => n.note);

    const { noteDurations, durationScore, beatUnit } = evaluateDurations(notes, expected, expectedRatios, timeSignature);
    const hits         = expected.filter((n, i) => recognized[i] === n).length;
    const totalNotes   = Math.max(expected.length, recognized.length);
    const pitchScore   = totalNotes > 0 ? (hits / totalNotes) * 100 : 0;
    const scorePercent = Math.round(durationScore != null ? pitchScore * 0.75 + durationScore * 0.25 : pitchScore);
    const passed       = scorePercent >= 80;

    // Save attempt (keep last 10 per user per task)
    await pool.query(
      `INSERT INTO practice_task_attempts (user_id, task_id, score_percent, passed, recognized_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, taskId, scorePercent, passed, JSON.stringify({ notes })],
    );
    await pool.query(
      `DELETE FROM practice_task_attempts
       WHERE user_id = $1 AND task_id = $2
         AND id NOT IN (SELECT id FROM practice_task_attempts WHERE user_id = $1 AND task_id = $2 ORDER BY created_at DESC LIMIT 10)`,
      [userId, taskId],
    );

    // Award coins if passed (no cap — motivate repeat practice)
    let coinsEarned = 0;
    if (passed) {
      coinsEarned = COINS_PER_PASS;
      await pool.query(
        'UPDATE users SET coins = coins + $1 WHERE id = $2',
        [coinsEarned, userId],
      );
    }

    res.json({ scorePercent, passed, recognized, expected, notes, noteDurations, durationScore,
      timeSignature: timeSignature ?? null, beatUnit: beatUnit ?? null, coinsEarned });
  } catch (err) {
    console.error('submitTaskAttempt error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
}

// ── GET /api/practice/tasks/:taskId/attempts ──────────────────────────────────

export async function getTaskAttempts(req, res) {
  const userId = req.user.userId;
  const taskId = parseInt(req.params.taskId, 10);
  if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task id' });
  const { rows } = await pool.query(
    `SELECT id, score_percent, passed, created_at FROM practice_task_attempts
     WHERE user_id = $1 AND task_id = $2 ORDER BY created_at DESC LIMIT 10`,
    [userId, taskId],
  );
  res.json({ attempts: rows });
}

// ── GET /api/practice/coins ───────────────────────────────────────────────────

export async function getUserCoins(req, res) {
  const userId = req.user.userId;
  const { rows } = await pool.query(
    'SELECT coins FROM users WHERE id = $1',
    [userId],
  );
  res.json({ coins: rows[0]?.coins ?? 0 });
}

// ── POST /api/practice/tasks/:taskId/feedback ─────────────────────────────────

export async function getTaskFeedback(req, res) {
  const { expected = [], recognized = [], scorePercent = 0, noteDurations = [], durationScore = null, timeSignature = null } = req.body;

  const wrongList    = expected.map((n, i) => recognized[i] && recognized[i] !== n ? `${n} → ${recognized[i]}` : null).filter(Boolean);
  const missingList  = expected.filter((_, i) => !recognized[i]);
  const tooShortList = noteDurations.map((d, i) => d.match === false && d.recognized != null && d.recognized < d.expected ? `${expected[i]}` : null).filter(Boolean);
  const tooLongList  = noteDurations.map((d, i) => d.match === false && d.recognized != null && d.recognized > d.expected ? `${expected[i]}` : null).filter(Boolean);

  const pitchSection    = [wrongList.length ? `Wrong: ${wrongList.join(', ')}` : null, missingList.length ? `Missing: ${missingList.join(', ')}` : null, !wrongList.length && !missingList.length ? 'All pitches correct' : null].filter(Boolean).join('\n');
  const durationSection = durationScore != null ? [`Duration accuracy: ${durationScore}%`, tooShortList.length ? `Too short: ${tooShortList.join(', ')}` : null, tooLongList.length ? `Too long: ${tooLongList.join(', ')}` : null, !tooShortList.length && !tooLongList.length ? 'All durations correct' : null].filter(Boolean).join('\n') : null;

  const prompt = `You are a strict but supportive piano teacher giving feedback on a student's practice performance.\nTask: play ${expected.join(' – ')}${timeSignature ? ` (${timeSignature})` : ''}.\nOverall score: ${scorePercent}%\nPITCH RESULTS:\n${pitchSection}${durationSection ? `\nDURATION RESULTS:\n${durationSection}` : ''}\nWrite clear, specific feedback in 3–5 sentences. Be direct and actionable.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 300 }),
    });
    if (!groqRes.ok) return res.status(502).json({ error: 'Groq API error' });
    const data = await groqRes.json();
    res.json({ feedback: data.choices?.[0]?.message?.content?.trim() ?? '' });
  } catch (err) {
    console.error('getTaskFeedback error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── Legacy lesson-based practice (kept for backward compat) ───────────────────

export async function submitPracticeTranscription(_req, res) {
  res.status(410).json({ error: 'Use /api/practice/tasks/:taskId/submit instead' });
}
export async function getPracticeAttempts(_req, res) {
  res.status(410).json({ error: 'Use /api/practice/tasks/:taskId/attempts instead' });
}
