ALTER TABLE class_group ADD COLUMN homeroom_teacher_id BIGINT;
ALTER TABLE class_group ADD CONSTRAINT class_group_homeroom_teacher_fkey
    FOREIGN KEY (homeroom_teacher_id) REFERENCES teacher(id);
