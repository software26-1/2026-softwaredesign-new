-- V11__create_analytics_schema.sql
-- OLAP analytics layer. Operational tables stay in `public`; the star-schema
-- dimensions/facts live in a dedicated `analytics` schema, populated by the
-- batch ETL (AnalyticsEtlService) via native upserts.

CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- Dimensions
-- ============================================================

-- dim_student PK = operational student.id (NOT generated)
CREATE TABLE IF NOT EXISTS analytics.dim_student (
    student_key     BIGINT PRIMARY KEY,
    student_name    VARCHAR(100),
    class_group_id  BIGINT,
    class_name      VARCHAR(100),
    grade_level     INT,
    school_id       BIGINT,
    etl_loaded_at   TIMESTAMP
);

-- dim_course PK = operational course.id (NOT generated)
CREATE TABLE IF NOT EXISTS analytics.dim_course (
    course_key      BIGINT PRIMARY KEY,
    course_name     VARCHAR(100),
    course_type     VARCHAR(20),
    teacher_id      BIGINT,
    teacher_name    VARCHAR(100),
    etl_loaded_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics.dim_date (
    date_key        DATE PRIMARY KEY,
    year            INT,
    semester        INT,
    month           INT,
    week_of_year    INT,
    day_of_week     INT
);

-- ============================================================
-- Facts
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics.fact_student_course_term (
    id                  BIGSERIAL PRIMARY KEY,
    student_key         BIGINT,
    course_key          BIGINT,
    year                INT,
    semester            INT,
    avg_score           NUMERIC(5,2),
    midterm_score       NUMERIC(5,2),
    final_score         NUMERIC(5,2),
    task_score          NUMERIC(5,2),
    weighted_score      NUMERIC(5,2),
    class_rank          INT,
    class_avg_score     NUMERIC(5,2),
    last_refreshed_at   TIMESTAMP,
    UNIQUE (student_key, course_key, year, semester)
);

CREATE TABLE IF NOT EXISTS analytics.fact_student_learning_summary (
    id                  BIGSERIAL PRIMARY KEY,
    student_key         BIGINT,
    year                INT,
    semester            INT,
    overall_avg_score   NUMERIC(5,2),
    overall_class_rank  INT,
    attendance_rate     NUMERIC(5,2),
    absent_count        INT,
    late_count          INT,
    early_leave_count   INT,
    feedback_total      INT,
    positive_feedback   INT,
    negative_feedback   INT,
    counseling_count    INT,
    score_trend         VARCHAR(20),
    risk_flag           BOOLEAN,
    last_refreshed_at   TIMESTAMP,
    UNIQUE (student_key, year, semester)
);

CREATE TABLE IF NOT EXISTS analytics.fact_class_course_stats (
    id                      BIGSERIAL PRIMARY KEY,
    class_group_id          BIGINT,
    course_key              BIGINT,
    year                    INT,
    semester                INT,
    student_count           INT,
    avg_score               NUMERIC(5,2),
    max_score               NUMERIC(5,2),
    min_score               NUMERIC(5,2),
    stddev_score            NUMERIC(5,2),
    avg_attendance_rate     NUMERIC(5,2),
    last_refreshed_at       TIMESTAMP,
    UNIQUE (class_group_id, course_key, year, semester)
);

-- ============================================================
-- ETL job log
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics.etl_job_log (
    id              BIGSERIAL PRIMARY KEY,
    job_name        VARCHAR(100),
    started_at      TIMESTAMP,
    finished_at     TIMESTAMP,
    status          VARCHAR(20),
    rows_processed  INT,
    error_message   TEXT
);

-- ============================================================
-- Indexes on fact tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_fact_sct_student_term
    ON analytics.fact_student_course_term (student_key, year, semester);
CREATE INDEX IF NOT EXISTS idx_fact_sct_course_term
    ON analytics.fact_student_course_term (course_key, year, semester);
CREATE INDEX IF NOT EXISTS idx_fact_sls_student_term
    ON analytics.fact_student_learning_summary (student_key, year, semester);
CREATE INDEX IF NOT EXISTS idx_fact_ccs_class_term
    ON analytics.fact_class_course_stats (class_group_id, year, semester);
