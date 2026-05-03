-- Migration: add practice_transcription_attempts table
-- Run once on the deployed database

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
