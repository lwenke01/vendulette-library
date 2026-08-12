-- 0002_add_collections_columns.sql
-- Adds missing columns to existing Collections table

ALTER TABLE Collections ADD COLUMN isComplete INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Collections ADD COLUMN last_updated_at TEXT;
ALTER TABLE Collections ADD COLUMN link TEXT;
ALTER TABLE Collections ADD COLUMN inLookbook INTEGER NOT NULL DEFAULT 1;