ALTER TABLE approval_request ADD COLUMN from_school_id BIGINT REFERENCES school(id);
ALTER TABLE approval_request ADD COLUMN to_school_id BIGINT REFERENCES school(id);
ALTER TABLE approval_request ADD COLUMN from_school_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE approval_request ADD COLUMN to_school_status VARCHAR(20) DEFAULT 'PENDING';
