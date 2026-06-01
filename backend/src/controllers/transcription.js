//backend/src/controllers/transcription.js - 
import fs   from 'fs';
import pool from '../db/index.js';
import { refreshProgress } from '../helpers/progress.js';

// Beat-unit multiplier based on time signature:
//   compound (6/8, 9/8, 12/8) → dotted quarter = 1.5 quarters
//   half-time (2/2, 3/2)      → half = 2 quarters
//   simple 3/8                → eighth = 0.5 quarters
//   simple x/4                → quarter = 1
function beatMultiplierFor(timeSignature) {
  if (!timeSignature) return 1;
  const [top, bottom] = timeSignature.split('/').map(Number);
  if (bottom === 8 && top % 3 === 0 && top > 3) return 1.5;
  if (bottom === 2)                  return 2;
  if (bottom === 8)                  return 0.5;
  return 1;
}

// Median of an array
function median(arr) {
  const s   = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

// Compare recognized note durations against expected ratios.
// Returns { noteDurations, durationScore, beatUnit }.
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

  const hits         = noteDurations.filter(d => d.match === true).length;
  const durationScore = Math.round((hits / expected.length) * 100);

  return { noteDurations, durationScore, beatUnit: parseFloat(beatUnit.toFixed(3)) };
}

export async function getLessonTranscription(req, res) {
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { rows } = await pool.query(
    `SELECT lb.id AS block_id, lb.title, lb.position, tb.instruction_text, tb.expected_json
     FROM lesson_blocks lb
     JOIN transcription_blocks tb ON tb.block_id = lb.id
     WHERE lb.lesson_id = $1 AND lb.tab_type = 'transcription'
     ORDER BY lb.position LIMIT 1`,
    [lessonId],
  );
  if (!rows.length) return res.status(404).json({ error: 'No transcription block' });
  res.json({ block: rows[0] });
}

export async function submitTranscription(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.id, 10);
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

    // Forward audio to Python transcription service
    const formData = new FormData();
    formData.append('audio', new Blob([fs.readFileSync(filePath)]), req.file.originalname || 'audio.webm');
    const pyRes = await fetch(`${process.env.TRANSCRIPTION_SERVICE_URL ?? 'http://localhost:5001'}/transcribe`, { method: 'POST', body: formData });
    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return res.status(500).json({ error: 'Transcription service error', details: err });
    }
    const { notes } = await pyRes.json();

    const expected      = block.expected_json?.notes         ?? [];
    const expectedRatios = block.expected_json?.durations    ?? null;
    const timeSignature  = block.expected_json?.timeSignature ?? null;
    const recognized    = notes.map(n => n.note);

    const { noteDurations, durationScore, beatUnit } = evaluateDurations(notes, expected, expectedRatios, timeSignature);

    const hits       = expected.filter((n, i) => recognized[i] === n).length;
    // Extra notes penalise the pitch score — denominator = max(expected, recognized)
    const totalNotes = Math.max(expected.length, recognized.length);
    const pitchScore = totalNotes > 0 ? (hits / totalNotes) * 100 : 0;
    // Duration is 25% of the final score only when duration data is available
    const scorePercent = Math.round(
      durationScore != null
        ? pitchScore * 0.75 + durationScore * 0.25
        : pitchScore,
    );
    const passed = scorePercent >= 80;

    // Save best result
    await pool.query(
      `INSERT INTO user_transcription_results
         (user_id, lesson_id, transcription_block_id, original_file_name, recognized_json, score_percent, passed)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, lesson_id, transcription_block_id) DO UPDATE
         SET recognized_json    = CASE WHEN EXCLUDED.score_percent >= user_transcription_results.score_percent THEN EXCLUDED.recognized_json    ELSE user_transcription_results.recognized_json    END,
             original_file_name = CASE WHEN EXCLUDED.score_percent >= user_transcription_results.score_percent THEN EXCLUDED.original_file_name ELSE user_transcription_results.original_file_name END,
             score_percent      = GREATEST(user_transcription_results.score_percent, EXCLUDED.score_percent),
             passed             = user_transcription_results.passed OR EXCLUDED.passed,
             updated_at         = NOW()`,
      [userId, lessonId, block.block_id, req.file.originalname || 'audio.webm', JSON.stringify({ notes }), scorePercent, passed],
    );

    // Save attempt history (keep last 10 per user per block)
    const MAX_ATTEMPTS = 10;
    await pool.query(
      `INSERT INTO user_transcription_attempts
         (user_id, lesson_id, transcription_block_id, score_percent, passed, recognized_json)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, lessonId, block.block_id, scorePercent, passed, JSON.stringify({ notes })],
    );
    await pool.query(
      `DELETE FROM user_transcription_attempts
       WHERE user_id = $1 AND transcription_block_id = $2
         AND id NOT IN (
           SELECT id FROM user_transcription_attempts
           WHERE user_id = $1 AND transcription_block_id = $2
           ORDER BY created_at DESC
           LIMIT $3
         )`,
      [userId, block.block_id, MAX_ATTEMPTS],
    );

    if (passed) {
      const { rows: prev } = await pool.query(
        `SELECT transcription_completed FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
        [userId, lessonId],
      );
      const alreadyDone = prev[0]?.transcription_completed ?? false;
      await pool.query(
        `INSERT INTO user_lesson_progress (user_id, lesson_id, transcription_completed, transcription_score_percent, status)
         VALUES ($1,$2,true,$3,'available')
         ON CONFLICT (user_id, lesson_id) DO UPDATE
           SET transcription_completed     = true,
               transcription_score_percent = GREATEST(user_lesson_progress.transcription_score_percent, EXCLUDED.transcription_score_percent)`,
        [userId, lessonId, scorePercent],
      );
      await refreshProgress(userId, lessonId);
      if (!alreadyDone) {
        await pool.query('UPDATE users SET xp = xp + 50 WHERE id = $1', [userId]);
      }
    }

    res.json({ scorePercent, passed, recognized, expected, notes, noteDurations, durationScore,
      timeSignature: timeSignature ?? null, beatUnit: beatUnit ?? null });
  } catch (err) {
    console.error('submitTranscription error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
}

export async function skipTranscription(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  try {
    await pool.query(
      `INSERT INTO user_lesson_progress
         (user_id, lesson_id, transcription_completed, transcription_score_percent, status)
       VALUES ($1, $2, true, 100, 'available')
       ON CONFLICT (user_id, lesson_id) DO UPDATE
         SET transcription_completed     = true,
             transcription_score_percent = GREATEST(
               COALESCE(user_lesson_progress.transcription_score_percent, 0),
               100
             )`,
      [userId, lessonId],
    );
    await refreshProgress(userId, lessonId);
    res.json({ ok: true });
  } catch (err) {
    console.error('skipTranscription error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getTranscriptionAttempts(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { rows } = await pool.query(
    `SELECT a.id, a.score_percent, a.passed, a.created_at
     FROM user_transcription_attempts a
     JOIN lesson_blocks lb ON lb.id = a.transcription_block_id
     WHERE a.user_id = $1 AND a.lesson_id = $2 AND lb.tab_type = 'transcription'
     ORDER BY a.created_at DESC
     LIMIT 10`,
    [userId, lessonId],
  );
  res.json({ attempts: rows });
}

const _NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function _toMidi(n) { const m = n.match(/^([A-G]#?)(\d)$/); if (!m) return 0; return parseInt(m[2]) * 12 + _NOTES.indexOf(m[1]) + 12; }
function _diffWords(e, r) {
  const d = _toMidi(r) - _toMidi(e), a = Math.abs(d), dir = d > 0 ? 'higher' : 'lower';
  return a % 2 === 0 ? `${a/2} tone${a/2>1?'s':''} ${dir}` : `${a} semitone${a>1?'s':''} ${dir}`;
}
function _durWord(rec, exp) {
  const q = rec / exp;
  if (q < 0.5) return 'much too short'; if (q < 0.82) return 'too short';
  if (q > 2.0) return 'much too long';  if (q > 1.22) return 'too long';
  return 'correct';
}

export async function getTranscriptionFeedback(req, res) {
  const { expected = [], recognized = [], scorePercent = 0, noteDurations = [], durationScore = null, timeSignature = null } = req.body;

  // Filter out artifact notes (>12 semitones = 1 octave from expected) before sending to LLM
  const pitchErrors = expected.map((n, i) => {
    const r = recognized[i];
    if (!r || r === n) return null;
    if (Math.abs(_toMidi(r) - _toMidi(n)) > 12) return null; // skip artifacts
    return `${n}: ${_diffWords(n, r)}`;
  }).filter(Boolean);

  const durationErrors = noteDurations.map((d, i) => {
    if (d.recognized == null || d.expected == null) return null;
    const q = _durWord(d.recognized, d.expected);
    return q !== 'correct' ? `${expected[i]}: ${q}` : null;
  }).filter(Boolean);

  const missingNotes = expected.filter((_, i) => !recognized[i]);

  const perfect = pitchErrors.length === 0 && durationErrors.length === 0 && missingNotes.length === 0;

  const pitchLine = (() => {
    const parts = [];
    if (pitchErrors.length > 0) {
      if (pitchErrors.length > 3) {
        const diffs = expected.map((n,i) => { const r=recognized[i]; return r&&r!==n ? _toMidi(r)-_toMidi(n) : null; }).filter(v=>v!==null);
        if (diffs.every(d=>d>0)) parts.push(`most notes too high (e.g. ${pitchErrors.slice(0,2).join('; ')})`);
        else if (diffs.every(d=>d<0)) parts.push(`most notes too low (e.g. ${pitchErrors.slice(0,2).join('; ')})`);
        else parts.push(`${pitchErrors.length} notes wrong (e.g. ${pitchErrors.slice(0,3).join('; ')})`);
      } else {
        parts.push(pitchErrors.join('; '));
      }
    }
    if (missingNotes.length > 0) parts.push(`missing: ${missingNotes.join(', ')}`);
    return parts.length > 0 ? parts.join('; ') : 'none';
  })();

  const durLine = durationErrors.length === 0
    ? (durationScore != null ? 'none' : 'not assessed')
    : durationErrors.length > 3
      ? `${durationErrors.length} notes with timing issues (e.g. ${durationErrors.slice(0,2).join('; ')})`
      : durationErrors.join('; ');

  const prompt = [
    'You are an experienced piano teacher. Study these examples of good feedback:',
    '',
    'EXAMPLE 1 — pitch errors:',
    'Errors: C4 a tone higher, D4 a tone higher.',
    'Good feedback: "Your C4 and D4 were each a tone too high — you seem to be starting one key to the right. Place your thumb on the correct C key and practice the sequence slowly until the position is automatic."',
    '',
    'EXAMPLE 2 — duration errors:',
    'Errors: D4 too short, E4 too short.',
    'Good feedback: "All pitches were correct, but D4 and E4 were cut off too early. Practice with a metronome at 60 BPM and count each beat aloud while sustaining every note for its full value."',
    '',
    'EXAMPLE 3 — many pitch errors same direction:',
    'Errors: most notes too high (e.g. C4: 1 tone higher; D4: 1 tone higher).',
    'Good feedback: "You were consistently playing a tone too high throughout — your hand position seems shifted one key to the right. Return to C, orient your hand from that anchor, and run the sequence again slowly."',
    '',
    'EXAMPLE 4 — missing notes:',
    'Errors: missing: D4, E4, F4. Score: 13%.',
    'Good feedback: "You only played the first note — the rest of the sequence was not heard. Practice the full scale one note at a time, confirming each key before moving on."',
    '',
    'EXAMPLE 5 — perfect:',
    'No errors.',
    'Good feedback: "Every note was in tune and rhythmically precise — excellent control. Now try the same passage at a slightly faster tempo to build fluency."',
    '',
    'Now give feedback for this performance:',
    `Task: play ${expected.join(' – ')}${timeSignature ? ` (${timeSignature})` : ''}. Score: ${scorePercent}%`,
    `Pitch errors: ${pitchLine}`,
    `Duration errors: ${durLine}`,
    perfect
      ? 'Give specific praise and suggest one concrete next challenge. Max 2 sentences.'
      : 'Use interval direction only (e.g. "a tone too high") — never "sharp"/"flat", never raw note names. Duration: "too short"/"too long" only. One practice tip. Max 3 sentences.',
    'Feedback:',
  ].join('\n');

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens:  200,
      }),
    });
    if (!groqRes.ok) return res.status(502).json({ error: 'Groq API error' });
    const data = await groqRes.json();
    res.json({ feedback: data.choices?.[0]?.message?.content?.trim() ?? '' });
  } catch (err) {
    console.error('getTranscriptionFeedback error:', err);
    res.status(500).json({ error: err.message });
  }
}
