-- Migration 004: add xp column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0);
