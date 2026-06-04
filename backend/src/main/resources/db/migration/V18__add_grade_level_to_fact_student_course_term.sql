ALTER TABLE analytics.fact_student_course_term
    ADD COLUMN IF NOT EXISTS grade_level VARCHAR(2);
