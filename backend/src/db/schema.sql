-- =========================================================
-- Music Theory Learning App
-- Practical PostgreSQL schema
-- Hybrid design:
-- - JSONB for display/content blocks
-- - relational tables for logic-heavy test entities
-- - only best result stored for lesson test and transcription
-- =========================================================

-- Optional: run in a clean database
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- =========================
-- ENUMS
-- =========================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_tab_type') THEN
        CREATE TYPE lesson_tab_type AS ENUM ('theory', 'test', 'transcription');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_block_type') THEN
        CREATE TYPE lesson_block_type AS ENUM (
            'theory',
            'staff_example',
            'piano_example',
            'quiz',
            'ear_training',
            'piano_performance',
            'transcription'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
        CREATE TYPE progress_status AS ENUM ('locked', 'available', 'completed');
    END IF;
END$$;

-- =========================
-- USERS
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255) UNIQUE,
    display_name    VARCHAR(100),
    coins           BIGINT       NOT NULL DEFAULT 0 CHECK (coins >= 0),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- user must have at least one auth method
    CONSTRAINT chk_auth_method CHECK (
        password_hash IS NOT NULL OR google_id IS NOT NULL
    )
);

-- =========================
-- CURRICULUM
-- =========================

CREATE TABLE IF NOT EXISTS topics (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    position        INT NOT NULL,
    force_unlock    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_topics_position UNIQUE (position)
);

CREATE TABLE IF NOT EXISTS lessons (
    id              BIGSERIAL PRIMARY KEY,
    topic_id        BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    position        INT NOT NULL,
    force_unlock    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lessons_topic_position UNIQUE (topic_id, position)
);

CREATE INDEX IF NOT EXISTS idx_lessons_topic_id ON lessons(topic_id);

-- =========================
-- LESSON BLOCKS
-- Each lesson has fixed tabs:
--   theory
--   test
--   transcription
-- Blocks are ordered inside each tab.
-- =========================

CREATE TABLE IF NOT EXISTS lesson_blocks (
    id              BIGSERIAL PRIMARY KEY,
    lesson_id       BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    tab_type        lesson_tab_type NOT NULL,
    block_type      lesson_block_type NOT NULL,
    title           VARCHAR(255),
    position        INT NOT NULL,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lesson_blocks_position UNIQUE (lesson_id, tab_type, position),

    CONSTRAINT chk_lesson_block_tab_match CHECK (
        (tab_type = 'theory' AND block_type IN ('theory', 'staff_example', 'piano_example'))
        OR
        (tab_type = 'test' AND block_type IN ('quiz', 'ear_training', 'piano_performance'))
        OR
        (tab_type = 'transcription' AND block_type = 'transcription')
    )
);

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id ON lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_tab_type ON lesson_blocks(tab_type);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_block_type ON lesson_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_tab ON lesson_blocks(lesson_id, tab_type);

-- Optional: if you want exactly one transcription block per lesson
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_transcription_block_per_lesson
ON lesson_blocks(lesson_id, block_type)
WHERE block_type = 'transcription';

-- ========================================================
-- THEORY TAB BLOCKS
-- ========================================================

CREATE TABLE IF NOT EXISTS theory_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    content_json     JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_example_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    content_json     JSONB NOT NULL,
    audio_json       JSONB,
    description      TEXT
);

CREATE TABLE IF NOT EXISTS piano_example_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    content_json     JSONB NOT NULL,
    description      TEXT
);

-- ========================================================
-- TEST TAB BLOCKS
-- ========================================================

CREATE TABLE IF NOT EXISTS quiz_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id               BIGSERIAL PRIMARY KEY,
    quiz_block_id    BIGINT NOT NULL REFERENCES quiz_blocks(block_id) ON DELETE CASCADE,
    question_text    TEXT NOT NULL,
    explanation      TEXT,
    position         INT NOT NULL,
    CONSTRAINT uq_quiz_questions_position UNIQUE (quiz_block_id, position)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_block_id ON quiz_questions(quiz_block_id);

CREATE TABLE IF NOT EXISTS quiz_options (
    id               BIGSERIAL PRIMARY KEY,
    question_id      BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text      TEXT NOT NULL,
    is_correct       BOOLEAN NOT NULL DEFAULT FALSE,
    position         INT NOT NULL,
    CONSTRAINT uq_quiz_options_position UNIQUE (question_id, position)
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_id_question_id ON quiz_options(id, question_id);

CREATE TABLE IF NOT EXISTS ear_training_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    prompt_text      TEXT,
    config_json      JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS ear_training_options (
    id                    BIGSERIAL PRIMARY KEY,
    ear_training_block_id BIGINT NOT NULL REFERENCES ear_training_blocks(block_id) ON DELETE CASCADE,
    option_text           VARCHAR(255) NOT NULL,
    is_correct            BOOLEAN NOT NULL DEFAULT FALSE,
    position              INT NOT NULL,
    CONSTRAINT uq_ear_training_options_position UNIQUE (ear_training_block_id, position)
);

CREATE INDEX IF NOT EXISTS idx_ear_training_options_block_id ON ear_training_options(ear_training_block_id);
CREATE INDEX IF NOT EXISTS idx_ear_training_options_id_block_id ON ear_training_options(id, ear_training_block_id);

CREATE TABLE IF NOT EXISTS piano_performance_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    instruction_text TEXT,
    expected_json    JSONB NOT NULL
);

-- ========================================================
-- TRANSCRIPTION TAB BLOCK
-- ========================================================

CREATE TABLE IF NOT EXISTS transcription_blocks (
    block_id         BIGINT PRIMARY KEY REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    instruction_text TEXT,
    expected_json    JSONB NOT NULL
);

-- ========================================================
-- USER PROGRESS
-- Only best result is stored
-- ========================================================

CREATE TABLE IF NOT EXISTS user_topic_progress (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id                BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    progress_percent        NUMERIC(5,2) NOT NULL DEFAULT 0.00
                              CHECK (progress_percent >= 0 AND progress_percent <= 100),
    status                  progress_status NOT NULL DEFAULT 'locked',
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_topic_progress UNIQUE (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_lookup ON user_topic_progress(user_id, topic_id);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id                   BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    theory_completed            BOOLEAN NOT NULL DEFAULT FALSE,

    test_score_percent          NUMERIC(5,2)
                                  CHECK (test_score_percent >= 0 AND test_score_percent <= 100),
    test_completed              BOOLEAN NOT NULL DEFAULT FALSE,

    transcription_score_percent NUMERIC(5,2)
                                  CHECK (transcription_score_percent >= 0 AND transcription_score_percent <= 100),
    transcription_completed     BOOLEAN NOT NULL DEFAULT FALSE,

    progress_percent            NUMERIC(5,2) NOT NULL DEFAULT 0.00
                                  CHECK (progress_percent >= 0 AND progress_percent <= 100),
    status                      progress_status NOT NULL DEFAULT 'locked',
    completed_at                TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_lesson_progress UNIQUE (user_id, lesson_id),

    CONSTRAINT chk_test_completed_score CHECK (
        (test_completed = FALSE)
        OR
        (test_score_percent IS NOT NULL AND test_score_percent >= 80)
    ),

    CONSTRAINT chk_transcription_completed_score CHECK (
        (transcription_completed = FALSE)
        OR
        (transcription_score_percent IS NOT NULL AND transcription_score_percent >= 80)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lookup ON user_lesson_progress(user_id, lesson_id);

-- ========================================================
-- BEST TEST RESULT ONLY
-- One row per user per lesson
-- This row is updated only if a new score is better
-- ========================================================

CREATE TABLE IF NOT EXISTS user_lesson_test_results (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id               BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    score_percent           NUMERIC(5,2) NOT NULL
                              CHECK (score_percent >= 0 AND score_percent <= 100),
    passed                  BOOLEAN NOT NULL,
    checked_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_lesson_test_results UNIQUE (user_id, lesson_id),
    CONSTRAINT chk_test_result_passed_score CHECK (
        (passed = FALSE)
        OR
        (score_percent >= 80)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_test_results_user_id ON user_lesson_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_test_results_lesson_id ON user_lesson_test_results(lesson_id);

CREATE TABLE IF NOT EXISTS user_quiz_answers (
    id                      BIGSERIAL PRIMARY KEY,
    test_result_id          BIGINT NOT NULL REFERENCES user_lesson_test_results(id) ON DELETE CASCADE,
    question_id             BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_id      BIGINT NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
    is_correct              BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_test_result_id ON user_quiz_answers(test_result_id);

CREATE TABLE IF NOT EXISTS user_ear_training_answers (
    id                      BIGSERIAL PRIMARY KEY,
    test_result_id          BIGINT NOT NULL REFERENCES user_lesson_test_results(id) ON DELETE CASCADE,
    ear_training_block_id   BIGINT NOT NULL REFERENCES ear_training_blocks(block_id) ON DELETE CASCADE,
    selected_option_id      BIGINT NOT NULL REFERENCES ear_training_options(id) ON DELETE CASCADE,
    is_correct              BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_ear_training_answers_test_result_id ON user_ear_training_answers(test_result_id);

CREATE TABLE IF NOT EXISTS user_piano_performance_answers (
    id                         BIGSERIAL PRIMARY KEY,
    test_result_id             BIGINT NOT NULL REFERENCES user_lesson_test_results(id) ON DELETE CASCADE,
    piano_performance_block_id BIGINT NOT NULL REFERENCES piano_performance_blocks(block_id) ON DELETE CASCADE,
    performed_json             JSONB NOT NULL,
    score_percent              NUMERIC(5,2) NOT NULL
                                 CHECK (score_percent >= 0 AND score_percent <= 100),
    is_correct                 BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_piano_performance_answers_test_result_id
ON user_piano_performance_answers(test_result_id);

-- ========================================================
-- BEST TRANSCRIPTION RESULT ONLY
-- One row per user per lesson per transcription block
-- This row is updated only if a new score is better
-- ========================================================

CREATE TABLE IF NOT EXISTS user_transcription_results (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id               BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    transcription_block_id  BIGINT NOT NULL REFERENCES transcription_blocks(block_id) ON DELETE CASCADE,

    original_file_name      VARCHAR(255),
    original_file_path      TEXT,
    midi_file_path          TEXT,

    recognized_json         JSONB NOT NULL,
    score_percent           NUMERIC(5,2) NOT NULL
                              CHECK (score_percent >= 0 AND score_percent <= 100),
    passed                  BOOLEAN NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_transcription_results UNIQUE (user_id, lesson_id, transcription_block_id),
    CONSTRAINT chk_transcription_result_passed_score CHECK (
        (passed = FALSE)
        OR
        (score_percent >= 80)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_transcription_results_user_id ON user_transcription_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transcription_results_lesson_id ON user_transcription_results(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_transcription_results_block_id ON user_transcription_results(transcription_block_id);

-- ========================================================
-- Transcription attempt history (max 10 per user per block)
-- ========================================================

CREATE TABLE IF NOT EXISTS user_transcription_attempts (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id              BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    transcription_block_id BIGINT NOT NULL REFERENCES transcription_blocks(block_id) ON DELETE CASCADE,
    score_percent          NUMERIC(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    passed                 BOOLEAN NOT NULL,
    recognized_json        JSONB NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcription_attempts_user_block
    ON user_transcription_attempts(user_id, transcription_block_id);

-- ========================================================
-- Practice transcription attempts (separate from lesson progress)
-- ========================================================

CREATE TABLE IF NOT EXISTS practice_transcription_attempts (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transcription_block_id BIGINT NOT NULL REFERENCES transcription_blocks(block_id) ON DELETE CASCADE,
    score_percent          NUMERIC(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    passed                 BOOLEAN NOT NULL,
    recognized_json        JSONB NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_transcription_attempts_user_block
    ON practice_transcription_attempts(user_id, transcription_block_id);

-- ========================================================
-- updated_at trigger
-- ========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_topics_updated ON topics;
CREATE TRIGGER trg_topics_updated
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_lessons_updated ON lessons;
CREATE TRIGGER trg_lessons_updated
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_lesson_blocks_updated ON lesson_blocks;
CREATE TRIGGER trg_lesson_blocks_updated
BEFORE UPDATE ON lesson_blocks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_topic_progress_updated ON user_topic_progress;
CREATE TRIGGER trg_user_topic_progress_updated
BEFORE UPDATE ON user_topic_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_lesson_progress_updated ON user_lesson_progress;
CREATE TRIGGER trg_user_lesson_progress_updated
BEFORE UPDATE ON user_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_lesson_test_results_updated ON user_lesson_test_results;
CREATE TRIGGER trg_user_lesson_test_results_updated
BEFORE UPDATE ON user_lesson_test_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_transcription_results_updated ON user_transcription_results;
CREATE TRIGGER trg_user_transcription_results_updated
BEFORE UPDATE ON user_transcription_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();