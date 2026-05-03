-- Migration 002: practice task bank + coins
-- Run once on the deployed database

CREATE TABLE IF NOT EXISTS practice_tasks (
    id               BIGSERIAL PRIMARY KEY,
    lesson_id        BIGINT  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL DEFAULT '',
    instruction_text TEXT,
    expected_json    JSONB   NOT NULL DEFAULT '{"notes":[]}'::jsonb,
    position         INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_tasks_lesson_id
    ON practice_tasks(lesson_id);

CREATE TABLE IF NOT EXISTS practice_task_attempts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
    task_id         BIGINT NOT NULL REFERENCES practice_tasks(id)  ON DELETE CASCADE,
    score_percent   NUMERIC(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    passed          BOOLEAN NOT NULL,
    recognized_json JSONB   NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_task_attempts_user_task
    ON practice_task_attempts(user_id, task_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS coins BIGINT NOT NULL DEFAULT 0 CHECK (coins >= 0);
