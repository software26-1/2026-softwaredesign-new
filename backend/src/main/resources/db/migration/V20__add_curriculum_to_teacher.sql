ALTER TABLE teacher ADD COLUMN IF NOT EXISTS curriculum_id BIGINT REFERENCES curriculum(id);
