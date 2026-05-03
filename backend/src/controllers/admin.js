import pool from '../db/index.js';

// ── helpers ────────────────────────────────────────────────────────────────────

function mapBlock(row) {
  const base = {
    id:          row.id,
    tabType:     row.tab_type,
    blockType:   row.block_type,
    title:       row.title,
    position:    row.position,
    isRequired:  row.is_required,
  };
  switch (row.block_type) {
    case 'theory':
      return { ...base, contentJson: row.theory_content };
    case 'staff_example':
      return { ...base, contentJson: row.staff_content, audioJson: row.staff_audio, description: row.staff_desc };
    case 'piano_example':
      return { ...base, contentJson: row.piano_ex_content, description: row.piano_ex_desc };
    case 'quiz':
      return { ...base };
    case 'ear_training':
      return { ...base, promptText: row.ear_prompt, configJson: row.ear_config };
    case 'piano_performance':
      return { ...base, instructionText: row.piano_perf_instruction, expectedJson: row.piano_perf_expected };
    case 'transcription':
      return { ...base, instructionText: row.transcription_instruction, expectedJson: row.transcription_expected };
    default:
      return base;
  }
}

async function nextPosition(table, groupCol, groupVal, tabType) {
  let q, params;
  if (tabType !== undefined) {
    q = `SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM ${table} WHERE ${groupCol} = $1 AND tab_type = $2`;
    params = [groupVal, tabType];
  } else {
    q = `SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM ${table} WHERE ${groupCol} = $1`;
    params = [groupVal];
  }
  const { rows } = await pool.query(q, params);
  return rows[0].pos;
}

// ── TOPICS ─────────────────────────────────────────────────────────────────────

export async function getTopics(req, res) {
  const { rows } = await pool.query('SELECT * FROM topics ORDER BY position');
  res.json(rows);
}

export async function createTopic(req, res) {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const pos = await nextPosition('topics', 'id', 0);
  const { rows: [topic] } = await pool.query(
    'INSERT INTO topics (title, description, position) VALUES ($1, $2, $3) RETURNING *',
    [title, description ?? null, req.body.position ?? pos],
  );
  res.status(201).json(topic);
}

export async function updateTopic(req, res) {
  const id = parseInt(req.params.id, 10);
  const { title, description, position, force_unlock } = req.body;
  const { rows } = await pool.query(
    `UPDATE topics SET
       title        = COALESCE($1, title),
       description  = COALESCE($2, description),
       position     = COALESCE($3, position),
       force_unlock = COALESCE($4, force_unlock)
     WHERE id = $5 RETURNING *`,
    [title ?? null, description ?? null, position ?? null, force_unlock ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deleteTopic(req, res) {
  const id = parseInt(req.params.id, 10);
  await pool.query('DELETE FROM topics WHERE id = $1', [id]);
  res.json({ ok: true });
}

// ── LESSONS ────────────────────────────────────────────────────────────────────

export async function getLessons(req, res) {
  const topicId = parseInt(req.params.topicId, 10);
  const { rows } = await pool.query(
    'SELECT * FROM lessons WHERE topic_id = $1 ORDER BY position',
    [topicId],
  );
  res.json(rows);
}

export async function createLesson(req, res) {
  const topicId = parseInt(req.params.topicId, 10);
  const { title, description, position } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const pos = position ?? await nextPosition('lessons', 'topic_id', topicId);
  const { rows: [lesson] } = await pool.query(
    'INSERT INTO lessons (topic_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *',
    [topicId, title, description ?? null, pos],
  );
  res.status(201).json(lesson);
}

export async function updateLesson(req, res) {
  const id = parseInt(req.params.id, 10);
  const { title, description, position, force_unlock } = req.body;
  const { rows } = await pool.query(
    `UPDATE lessons SET
       title        = COALESCE($1, title),
       description  = COALESCE($2, description),
       position     = COALESCE($3, position),
       force_unlock = COALESCE($4, force_unlock)
     WHERE id = $5 RETURNING *`,
    [title ?? null, description ?? null, position ?? null, force_unlock ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deleteLesson(req, res) {
  const id = parseInt(req.params.id, 10);
  await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
  res.json({ ok: true });
}

// ── BLOCKS ─────────────────────────────────────────────────────────────────────

export async function getBlocks(req, res) {
  const lessonId = parseInt(req.params.lessonId, 10);
  const { rows } = await pool.query(
    `SELECT lb.id, lb.tab_type, lb.block_type, lb.title, lb.position, lb.is_required,
            tb.content_json AS theory_content,
            seb.content_json AS staff_content, seb.audio_json AS staff_audio, seb.description AS staff_desc,
            peb.content_json AS piano_ex_content, peb.description AS piano_ex_desc,
            etb.prompt_text AS ear_prompt, etb.config_json AS ear_config,
            ppb.instruction_text AS piano_perf_instruction, ppb.expected_json AS piano_perf_expected,
            trb.instruction_text AS transcription_instruction, trb.expected_json AS transcription_expected
     FROM lesson_blocks lb
     LEFT JOIN theory_blocks tb             ON tb.block_id  = lb.id
     LEFT JOIN staff_example_blocks seb     ON seb.block_id = lb.id
     LEFT JOIN piano_example_blocks peb     ON peb.block_id = lb.id
     LEFT JOIN ear_training_blocks etb      ON etb.block_id = lb.id
     LEFT JOIN piano_performance_blocks ppb ON ppb.block_id = lb.id
     LEFT JOIN transcription_blocks trb     ON trb.block_id = lb.id
     WHERE lb.lesson_id = $1
     ORDER BY lb.tab_type, lb.position`,
    [lessonId],
  );
  res.json(rows.map(mapBlock));
}

export async function createBlock(req, res) {
  const lessonId  = parseInt(req.params.lessonId, 10);
  const { tab_type, block_type, title, is_required = true, position, content = {} } = req.body;
  if (!tab_type || !block_type) return res.status(400).json({ error: 'tab_type and block_type required' });

  const pos = position ?? await nextPosition('lesson_blocks', 'lesson_id', lessonId, tab_type);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [lb] } = await client.query(
      `INSERT INTO lesson_blocks (lesson_id, tab_type, block_type, title, position, is_required)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [lessonId, tab_type, block_type, title ?? null, pos, is_required],
    );

    await insertBlockContent(client, lb.id, block_type, content);

    await client.query('COMMIT');
    res.status(201).json({ id: lb.id, ...lb });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createBlock error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function updateBlock(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  const { title, position, is_required, content } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE lesson_blocks SET
         title       = COALESCE($1, title),
         position    = COALESCE($2, position),
         is_required = COALESCE($3, is_required)
       WHERE id = $4 RETURNING *`,
      [title ?? null, position ?? null, is_required ?? null, blockId],
    );
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    if (content !== undefined) {
      await updateBlockContent(client, blockId, rows[0].block_type, content);
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateBlock error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function reorderBlocks(req, res) {
  const { blockIds } = req.body;
  if (!Array.isArray(blockIds) || !blockIds.length)
    return res.status(400).json({ error: 'blockIds array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Move all to negative positions first to avoid UNIQUE conflicts
    for (let i = 0; i < blockIds.length; i++) {
      await client.query('UPDATE lesson_blocks SET position = $1 WHERE id = $2', [-(i + 1), blockIds[i]]);
    }
    // Then assign final positions
    for (let i = 0; i < blockIds.length; i++) {
      await client.query('UPDATE lesson_blocks SET position = $1 WHERE id = $2', [i + 1, blockIds[i]]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reorderBlocks error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function swapBlocks(req, res) {
  const { blockIdA, blockIdB } = req.body;
  if (!blockIdA || !blockIdB) return res.status(400).json({ error: 'blockIdA and blockIdB required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT id, position FROM lesson_blocks WHERE id = ANY($1)',
      [[blockIdA, blockIdB]],
    );
    if (rows.length !== 2) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Block not found' }); }

    const a = rows.find(r => r.id === blockIdA);
    const b = rows.find(r => r.id === blockIdB);

    // Use a temporary position to avoid UNIQUE constraint conflicts during swap
    const tmpPos = -1;
    await client.query('UPDATE lesson_blocks SET position = $1 WHERE id = $2', [tmpPos, a.id]);
    await client.query('UPDATE lesson_blocks SET position = $1 WHERE id = $2', [a.position, b.id]);
    await client.query('UPDATE lesson_blocks SET position = $1 WHERE id = $2', [b.position, a.id]);

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('swapBlocks error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function deleteBlock(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  await pool.query('DELETE FROM lesson_blocks WHERE id = $1', [blockId]);
  res.json({ ok: true });
}

async function insertBlockContent(client, blockId, blockType, content) {
  switch (blockType) {
    case 'theory':
      await client.query(
        'INSERT INTO theory_blocks (block_id, content_json) VALUES ($1, $2)',
        [blockId, JSON.stringify(content.contentJson ?? { blocks: [] })],
      );
      break;
    case 'staff_example':
      await client.query(
        'INSERT INTO staff_example_blocks (block_id, content_json, audio_json, description) VALUES ($1, $2, $3, $4)',
        [blockId, JSON.stringify(content.contentJson ?? {}), content.audioJson ? JSON.stringify(content.audioJson) : null, content.description ?? null],
      );
      break;
    case 'piano_example':
      await client.query(
        'INSERT INTO piano_example_blocks (block_id, content_json, description) VALUES ($1, $2, $3)',
        [blockId, JSON.stringify(content.contentJson ?? {}), content.description ?? null],
      );
      break;
    case 'quiz':
      await client.query('INSERT INTO quiz_blocks (block_id) VALUES ($1)', [blockId]);
      break;
    case 'ear_training':
      await client.query(
        'INSERT INTO ear_training_blocks (block_id, prompt_text, config_json) VALUES ($1, $2, $3)',
        [blockId, content.promptText ?? null, JSON.stringify(content.configJson ?? { notes: [] })],
      );
      break;
    case 'piano_performance':
      await client.query(
        'INSERT INTO piano_performance_blocks (block_id, instruction_text, expected_json) VALUES ($1, $2, $3)',
        [blockId, content.instructionText ?? null, JSON.stringify(content.expectedJson ?? { notes: [] })],
      );
      break;
    case 'transcription':
      await client.query(
        'INSERT INTO transcription_blocks (block_id, instruction_text, expected_json) VALUES ($1, $2, $3)',
        [blockId, content.instructionText ?? null, JSON.stringify(content.expectedJson ?? { notes: [], durations: [], timeSignature: '4/4' })],
      );
      break;
  }
}

async function updateBlockContent(client, blockId, blockType, content) {
  switch (blockType) {
    case 'theory':
      await client.query(
        'UPDATE theory_blocks SET content_json = $1 WHERE block_id = $2',
        [JSON.stringify(content.contentJson), blockId],
      );
      break;
    case 'staff_example':
      await client.query(
        'UPDATE staff_example_blocks SET content_json = $1, audio_json = $2, description = $3 WHERE block_id = $4',
        [JSON.stringify(content.contentJson), content.audioJson ? JSON.stringify(content.audioJson) : null, content.description ?? null, blockId],
      );
      break;
    case 'piano_example':
      await client.query(
        'UPDATE piano_example_blocks SET content_json = $1, description = $2 WHERE block_id = $3',
        [JSON.stringify(content.contentJson), content.description ?? null, blockId],
      );
      break;
    case 'ear_training':
      await client.query(
        'UPDATE ear_training_blocks SET prompt_text = $1, config_json = $2 WHERE block_id = $3',
        [content.promptText ?? null, JSON.stringify(content.configJson), blockId],
      );
      break;
    case 'piano_performance':
      await client.query(
        'UPDATE piano_performance_blocks SET instruction_text = $1, expected_json = $2 WHERE block_id = $3',
        [content.instructionText ?? null, JSON.stringify(content.expectedJson), blockId],
      );
      break;
    case 'transcription':
      await client.query(
        'UPDATE transcription_blocks SET instruction_text = $1, expected_json = $2 WHERE block_id = $3',
        [content.instructionText ?? null, JSON.stringify(content.expectedJson), blockId],
      );
      break;
  }
}

// ── QUIZ QUESTIONS & OPTIONS ───────────────────────────────────────────────────

export async function getQuestions(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  const { rows: questions } = await pool.query(
    'SELECT * FROM quiz_questions WHERE quiz_block_id = $1 ORDER BY position',
    [blockId],
  );
  const result = await Promise.all(questions.map(async q => {
    const { rows: options } = await pool.query(
      'SELECT * FROM quiz_options WHERE question_id = $1 ORDER BY position',
      [q.id],
    );
    return { ...q, options };
  }));
  res.json(result);
}

export async function createQuestion(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  const { question_text, explanation } = req.body;
  if (!question_text) return res.status(400).json({ error: 'question_text required' });
  const pos = await nextPosition('quiz_questions', 'quiz_block_id', blockId);
  const { rows: [q] } = await pool.query(
    'INSERT INTO quiz_questions (quiz_block_id, question_text, explanation, position) VALUES ($1, $2, $3, $4) RETURNING *',
    [blockId, question_text, explanation ?? null, pos],
  );
  res.status(201).json({ ...q, options: [] });
}

export async function updateQuestion(req, res) {
  const id = parseInt(req.params.id, 10);
  const { question_text, explanation } = req.body;
  const { rows } = await pool.query(
    'UPDATE quiz_questions SET question_text = COALESCE($1, question_text), explanation = COALESCE($2, explanation) WHERE id = $3 RETURNING *',
    [question_text ?? null, explanation ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deleteQuestion(req, res) {
  await pool.query('DELETE FROM quiz_questions WHERE id = $1', [parseInt(req.params.id, 10)]);
  res.json({ ok: true });
}

export async function createOption(req, res) {
  const questionId = parseInt(req.params.questionId, 10);
  const { option_text, is_correct = false } = req.body;
  if (!option_text) return res.status(400).json({ error: 'option_text required' });
  const pos = await nextPosition('quiz_options', 'question_id', questionId);
  const { rows: [o] } = await pool.query(
    'INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES ($1, $2, $3, $4) RETURNING *',
    [questionId, option_text, is_correct, pos],
  );
  res.status(201).json(o);
}

export async function updateOption(req, res) {
  const id = parseInt(req.params.id, 10);
  const { option_text, is_correct } = req.body;
  const { rows } = await pool.query(
    'UPDATE quiz_options SET option_text = COALESCE($1, option_text), is_correct = COALESCE($2, is_correct) WHERE id = $3 RETURNING *',
    [option_text ?? null, is_correct ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deleteOption(req, res) {
  await pool.query('DELETE FROM quiz_options WHERE id = $1', [parseInt(req.params.id, 10)]);
  res.json({ ok: true });
}

// ── EAR TRAINING OPTIONS ───────────────────────────────────────────────────────

export async function getEarOptions(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  const { rows } = await pool.query(
    'SELECT * FROM ear_training_options WHERE ear_training_block_id = $1 ORDER BY position',
    [blockId],
  );
  res.json(rows);
}

export async function createEarOption(req, res) {
  const blockId = parseInt(req.params.blockId, 10);
  const { option_text, is_correct = false } = req.body;
  if (!option_text) return res.status(400).json({ error: 'option_text required' });
  const pos = await nextPosition('ear_training_options', 'ear_training_block_id', blockId);
  const { rows: [o] } = await pool.query(
    'INSERT INTO ear_training_options (ear_training_block_id, option_text, is_correct, position) VALUES ($1, $2, $3, $4) RETURNING *',
    [blockId, option_text, is_correct, pos],
  );
  res.status(201).json(o);
}

export async function updateEarOption(req, res) {
  const id = parseInt(req.params.id, 10);
  const { option_text, is_correct } = req.body;
  const { rows } = await pool.query(
    'UPDATE ear_training_options SET option_text = COALESCE($1, option_text), is_correct = COALESCE($2, is_correct) WHERE id = $3 RETURNING *',
    [option_text ?? null, is_correct ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deleteEarOption(req, res) {
  await pool.query('DELETE FROM ear_training_options WHERE id = $1', [parseInt(req.params.id, 10)]);
  res.json({ ok: true });
}

// ── USERS ──────────────────────────────────────────────────────────────────────

export async function getUsers(req, res) {
  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role, is_blocked, streak_days, last_active_date, created_at
     FROM users ORDER BY created_at DESC`,
  );
  res.json(rows);
}

export async function updateUserRole(req, res) {
  const id   = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (id === req.user.userId) {
    return res.status(403).json({ error: 'Cannot change your own role' });
  }
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be "student" or "admin"' });
  }
  const { rows } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, display_name, role',
    [role, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function toggleUserBlock(req, res) {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.userId) {
    return res.status(403).json({ error: 'Cannot block yourself' });
  }
  const { rows } = await pool.query(
    'UPDATE users SET is_blocked = NOT is_blocked WHERE id = $1 RETURNING id, username, email, display_name, role, is_blocked',
    [id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

// ── PRACTICE TASKS ─────────────────────────────────────────────────────────────

export async function getPracticeTasks(req, res) {
  const lessonId = parseInt(req.params.lessonId, 10);
  const { rows } = await pool.query(
    'SELECT id, title, instruction_text, expected_json, position FROM practice_tasks WHERE lesson_id = $1 ORDER BY position, id',
    [lessonId],
  );
  res.json(rows);
}

export async function createPracticeTask(req, res) {
  const lessonId = parseInt(req.params.lessonId, 10);
  const { title = '', instruction_text = '', expected_json = { notes: [] } } = req.body;
  const pos = await nextPosition('practice_tasks', 'lesson_id', lessonId);
  const { rows: [task] } = await pool.query(
    `INSERT INTO practice_tasks (lesson_id, title, instruction_text, expected_json, position)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [lessonId, title, instruction_text, JSON.stringify(expected_json), pos],
  );
  res.status(201).json(task);
}

export async function updatePracticeTask(req, res) {
  const id = parseInt(req.params.id, 10);
  const { title, instruction_text, expected_json } = req.body;
  const { rows } = await pool.query(
    `UPDATE practice_tasks SET
       title            = COALESCE($1, title),
       instruction_text = COALESCE($2, instruction_text),
       expected_json    = COALESCE($3, expected_json),
       updated_at       = NOW()
     WHERE id = $4 RETURNING *`,
    [title ?? null, instruction_text ?? null, expected_json ? JSON.stringify(expected_json) : null, id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}

export async function deletePracticeTask(req, res) {
  const id = parseInt(req.params.id, 10);
  await pool.query('DELETE FROM practice_tasks WHERE id = $1', [id]);
  res.json({ ok: true });
}

// ── REORDER TOPICS / LESSONS ───────────────────────────────────────────────────

export async function reorderTopics(req, res) {
  const { topicIds } = req.body;
  if (!Array.isArray(topicIds) || !topicIds.length)
    return res.status(400).json({ error: 'topicIds array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < topicIds.length; i++)
      await client.query('UPDATE topics SET position = $1 WHERE id = $2', [-(i + 1), topicIds[i]]);
    for (let i = 0; i < topicIds.length; i++)
      await client.query('UPDATE topics SET position = $1 WHERE id = $2', [i + 1, topicIds[i]]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function reorderLessons(req, res) {
  const topicId  = parseInt(req.params.topicId, 10);
  const { lessonIds } = req.body;
  if (!Array.isArray(lessonIds) || !lessonIds.length)
    return res.status(400).json({ error: 'lessonIds array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < lessonIds.length; i++)
      await client.query('UPDATE lessons SET position = $1 WHERE id = $2 AND topic_id = $3', [-(i + 1), lessonIds[i], topicId]);
    for (let i = 0; i < lessonIds.length; i++)
      await client.query('UPDATE lessons SET position = $1 WHERE id = $2 AND topic_id = $3', [i + 1, lessonIds[i], topicId]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
