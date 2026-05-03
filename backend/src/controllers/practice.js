import fs   from 'fs';
import pool from '../db/index.js';

// ── helpers (copied from transcription.js to keep practice isolated) ──────────

function beatMultiplierFor(timeSignature) {
  if (!timeSignature) return 1;
  const [top, bottom] = timeSignature.split('/').map(Number);
  if (bottom === 8 && top % 3 === 0) return 1.5;
  if (bottom === 2)                  return 2;
  if (bottom === 8)                  return 0.5;
  return 1;
}

function median(arr) {
  const s   = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function evaluateDurations(notes, expected, expectedRatios, timeSignature) {
  if (!expectedRatios) {
    return {
      noteDurations: expected.map(() => ({ expectedRatio: null, expected: null, recognized: null, match: null })),
      durationScore: null,
      beatUnit:      null,
    };
  }
  const bm     = beatMultiplierFor(timeSignature);
  const paired = expectedRatios
    .map((r, i) => notes[i]?.duration != null ? { ratio: r * bm, dur: notes[i].duration } : null)
    .filter(Boolean);
  const beatUnit = paired.length > 0 ? median(paired.map(p => p.dur / p.ratio)) : 1;
  const noteDurations = expected.map((_, i) => {
    const ratio  = expectedRatios[i] ?? null;
    const recDur = notes[i]?.duration ?? null;
    const expDur = ratio != null ? parseFloat((ratio * bm * beatUnit).toFixed(2)) : null;
    const match  = expDur != null && recDur != null
      ? Math.abs(recDur - expDur) / expDur <= 0.2
      : null;
    return { expectedRatio: ratio, expected: expDur, recognized: recDur != null ? parseFloat(recDur.toFixed(2)) : null, match };
  });
  const hits          = noteDurations.filter(d => d.match === true).length;
  const durationScore = Math.round((hits / expected.length) * 100);
  return { noteDurations, durationScore, beatUnit: parseFloat(beatUnit.toFixed(3)) };
}

// ── GET /api/practice/transcription ──────────────────────────────────────────

export async function getPracticeTranscriptions(_req, res) {
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
        topicsMap.set(row.topic_id, { id: row.topic_id, title: row.topic_title, lessons: [] });
      }
      topicsMap.get(row.topic_id).lessons.push({ id: row.lesson_id, title: row.lesson_title });
    }
    res.json([...topicsMap.values()]);
  } catch (err) {
    console.error('getPracticeTranscriptions error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/practice/transcription/:lessonId/submit ─────────────────────────

export async function submitPracticeTranscription(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.lessonId, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });
  if (!req.file)       return res.status(400).json({ error: 'No audio file' });

  const filePath = req.file.path;
  try {
    const { rows: blockRows } = await pool.query(
      `SELECT lb.id AS block_id, tb.expected_json
       FROM lesson_blocks lb JOIN transcription_blocks tb ON tb.block_id = lb.id
       WHERE lb.lesson_id = $1 AND lb.tab_type = 'transcription' LIMIT 1`,
      [lessonId],
    );
    if (!blockRows.length) return res.status(404).json({ error: 'No transcription block' });
    const block = blockRows[0];

    const formData = new FormData();
    formData.append('audio', new Blob([fs.readFileSync(filePath)]), req.file.originalname || 'audio.webm');
    const pyRes = await fetch(`${process.env.TRANSCRIPTION_SERVICE_URL ?? 'http://localhost:5001'}/transcribe`, { method: 'POST', body: formData });
    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return res.status(500).json({ error: 'Transcription service error', details: err });
    }
    const { notes } = await pyRes.json();

    const expected       = block.expected_json?.notes         ?? [];
    const expectedRatios = block.expected_json?.durations     ?? null;
    const timeSignature  = block.expected_json?.timeSignature ?? null;
    const recognized     = notes.map(n => n.note);

    const { noteDurations, durationScore, beatUnit } = evaluateDurations(notes, expected, expectedRatios, timeSignature);

    const hits        = expected.filter((n, i) => recognized[i] === n).length;
    const totalNotes  = Math.max(expected.length, recognized.length);
    const pitchScore  = totalNotes > 0 ? (hits / totalNotes) * 100 : 0;
    const scorePercent = Math.round(
      durationScore != null ? pitchScore * 0.75 + durationScore * 0.25 : pitchScore,
    );
    const passed = scorePercent >= 80;

    // Save to practice_transcription_attempts — does NOT touch lesson progress
    const MAX_ATTEMPTS = 10;
    await pool.query(
      `INSERT INTO practice_transcription_attempts
         (user_id, transcription_block_id, score_percent, passed, recognized_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, block.block_id, scorePercent, passed, JSON.stringify({ notes })],
    );
    await pool.query(
      `DELETE FROM practice_transcription_attempts
       WHERE user_id = $1 AND transcription_block_id = $2
         AND id NOT IN (
           SELECT id FROM practice_transcription_attempts
           WHERE user_id = $1 AND transcription_block_id = $2
           ORDER BY created_at DESC
           LIMIT $3
         )`,
      [userId, block.block_id, MAX_ATTEMPTS],
    );

    res.json({ scorePercent, passed, recognized, expected, notes, noteDurations, durationScore,
      timeSignature: timeSignature ?? null, beatUnit: beatUnit ?? null });
  } catch (err) {
    console.error('submitPracticeTranscription error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
}

// ── GET /api/practice/transcription/:lessonId/attempts ────────────────────────

export async function getPracticeAttempts(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.lessonId, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { rows } = await pool.query(
    `SELECT a.id, a.score_percent, a.passed, a.created_at
     FROM practice_transcription_attempts a
     JOIN lesson_blocks lb ON lb.id = a.transcription_block_id
     WHERE a.user_id = $1 AND lb.lesson_id = $2
     ORDER BY a.created_at DESC
     LIMIT 10`,
    [userId, lessonId],
  );
  res.json({ attempts: rows });
}
