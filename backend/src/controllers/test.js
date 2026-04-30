import pool from '../db/index.js';
import { refreshProgress } from '../helpers/progress.js';

export async function getLessonTest(req, res) {
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { rows: lessonRows } = await pool.query(
    `SELECT l.id, l.title, t.title AS topic_title
     FROM lessons l JOIN topics t ON t.id = l.topic_id WHERE l.id = $1`,
    [lessonId],
  );
  if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });

  const { rows: blocks } = await pool.query(
    `SELECT lb.id AS block_id, lb.block_type, lb.title, lb.position
     FROM lesson_blocks lb WHERE lb.lesson_id = $1 AND lb.tab_type = 'test' ORDER BY lb.position`,
    [lessonId],
  );

  const result = [];
  for (const b of blocks) {
    if (b.block_type === 'quiz') {
      const { rows: questions } = await pool.query(
        `SELECT qq.id, qq.question_text, qq.position FROM quiz_questions qq
         WHERE qq.quiz_block_id = $1 ORDER BY qq.position`,
        [b.block_id],
      );
      const questionsWithOptions = await Promise.all(questions.map(async q => {
        const { rows: options } = await pool.query(
          `SELECT id, option_text, position FROM quiz_options WHERE question_id = $1 ORDER BY position`,
          [q.id],
        );
        const shuffled = [...options].sort(() => Math.random() - 0.5);
        return { id: q.id, questionText: q.question_text, position: q.position, options: shuffled };
      }));
      result.push({ blockId: b.block_id, type: 'quiz', title: b.title, position: b.position, questions: questionsWithOptions });
    }
    if (b.block_type === 'ear_training') {
      const { rows: etRows } = await pool.query(
        `SELECT prompt_text, config_json FROM ear_training_blocks WHERE block_id = $1`, [b.block_id],
      );
      const { rows: options } = await pool.query(
        `SELECT id, option_text, position FROM ear_training_options WHERE ear_training_block_id = $1 ORDER BY position`,
        [b.block_id],
      );
      result.push({ blockId: b.block_id, type: 'ear_training', title: b.title, position: b.position,
        promptText: etRows[0]?.prompt_text ?? '', config: etRows[0]?.config_json ?? {}, options });
    }
    if (b.block_type === 'piano_performance') {
      const { rows: ppRows } = await pool.query(
        `SELECT instruction_text, expected_json FROM piano_performance_blocks WHERE block_id = $1`, [b.block_id],
      );
      result.push({ blockId: b.block_id, type: 'piano_performance', title: b.title, position: b.position,
        instructionText: ppRows[0]?.instruction_text ?? '', expected: ppRows[0]?.expected_json ?? {} });
    }
  }

  res.json({ lesson: lessonRows[0], blocks: result });
}

export async function submitTest(req, res) {
  const userId   = req.user.userId;
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

  const { quizAnswers = [], earAnswers = [], pianoAnswers = [] } = req.body;
  const totalAnswers = quizAnswers.length + earAnswers.length + pianoAnswers.length;
  if (totalAnswers === 0) return res.status(400).json({ error: 'answers required' });

  try {
    let correct = 0;
    const checkedQuiz  = [];
    const checkedEar   = [];
    const checkedPiano = [];

    if (quizAnswers.length > 0) {
      const { rows: optRows } = await pool.query(
        `SELECT id, question_id, is_correct FROM quiz_options
         WHERE id = ANY($1) AND question_id = ANY($2)`,
        [quizAnswers.map(a => a.selectedOptionId), quizAnswers.map(a => a.questionId)],
      );
      const optMap = Object.fromEntries(optRows.map(o => [o.id, o]));
      for (const a of quizAnswers) {
        const isCorrect = optMap[a.selectedOptionId]?.is_correct ?? false;
        if (isCorrect) correct++;
        checkedQuiz.push({ questionId: a.questionId, selectedOptionId: a.selectedOptionId, isCorrect });
      }
    }

    if (earAnswers.length > 0) {
      const { rows: optRows } = await pool.query(
        `SELECT id, ear_training_block_id, is_correct FROM ear_training_options
         WHERE id = ANY($1) AND ear_training_block_id = ANY($2)`,
        [earAnswers.map(a => a.selectedOptionId), earAnswers.map(a => a.blockId)],
      );
      const optMap = Object.fromEntries(optRows.map(o => [o.id, o]));
      for (const a of earAnswers) {
        const isCorrect = optMap[a.selectedOptionId]?.is_correct ?? false;
        if (isCorrect) correct++;
        checkedEar.push({ blockId: a.blockId, selectedOptionId: a.selectedOptionId, isCorrect });
      }
    }

    for (const a of pianoAnswers) {
      const { rows: ppRows } = await pool.query(
        `SELECT expected_json FROM piano_performance_blocks WHERE block_id = $1`, [a.blockId],
      );
      const expected  = ppRows[0]?.expected_json?.notes ?? [];
      const performed = a.performed ?? [];
      const hits      = expected.filter((n, i) => performed[i] === n).length;
      const pianoScore = expected.length > 0 ? Math.round((hits / expected.length) * 100) : 0;
      const isCorrect  = pianoScore >= 80;
      if (isCorrect) correct++;
      checkedPiano.push({ blockId: a.blockId, performed, scorePercent: pianoScore, isCorrect });
    }

    const scorePercent = Math.round((correct / totalAnswers) * 100);
    const passed       = scorePercent >= 80;

    const { rows: resultRows } = await pool.query(
      `INSERT INTO user_lesson_test_results (user_id, lesson_id, score_percent, passed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, lesson_id) DO UPDATE
         SET score_percent = GREATEST(user_lesson_test_results.score_percent, EXCLUDED.score_percent),
             passed        = user_lesson_test_results.passed OR EXCLUDED.passed,
             updated_at    = NOW()
       RETURNING id, score_percent, passed`,
      [userId, lessonId, scorePercent, passed],
    );
    const { id: testResultId, score_percent: bestScore, passed: bestPassed } = resultRows[0];

    for (const a of checkedQuiz) {
      await pool.query(
        `INSERT INTO user_quiz_answers (test_result_id, question_id, selected_option_id, is_correct) VALUES ($1,$2,$3,$4)`,
        [testResultId, a.questionId, a.selectedOptionId, a.isCorrect],
      );
    }
    for (const a of checkedEar) {
      await pool.query(
        `INSERT INTO user_ear_training_answers (test_result_id, ear_training_block_id, selected_option_id, is_correct) VALUES ($1,$2,$3,$4)`,
        [testResultId, a.blockId, a.selectedOptionId, a.isCorrect],
      );
    }
    for (const a of checkedPiano) {
      await pool.query(
        `INSERT INTO user_piano_performance_answers (test_result_id, piano_performance_block_id, performed_json, score_percent, is_correct) VALUES ($1,$2,$3,$4,$5)`,
        [testResultId, a.blockId, JSON.stringify({ notes: a.performed }), a.scorePercent, a.isCorrect],
      );
    }

    if (bestPassed) {
      await pool.query(
        `INSERT INTO user_lesson_progress (user_id, lesson_id, test_completed, test_score_percent, status)
         VALUES ($1, $2, true, $3, 'available')
         ON CONFLICT (user_id, lesson_id) DO UPDATE
           SET test_completed     = true,
               test_score_percent = GREATEST(user_lesson_progress.test_score_percent, EXCLUDED.test_score_percent)`,
        [userId, lessonId, bestScore],
      );
      await refreshProgress(userId, lessonId);
    }

    res.json({ scorePercent, correct, total: totalAnswers, passed,
      bestScore: Number(bestScore), quizAnswers: checkedQuiz, earAnswers: checkedEar, pianoAnswers: checkedPiano });
  } catch (err) {
    console.error('submitTest error:', err);
    res.status(500).json({ error: err.message });
  }
}
