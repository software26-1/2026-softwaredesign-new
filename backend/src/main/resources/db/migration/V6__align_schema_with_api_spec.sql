-- V6__align_schema_with_api_spec.sql
-- API 명세 v2 기준으로 전체 테이블 스키마 정렬

-- ============================================================
-- Phase 1: DROP (자식 → 부모 순서)
-- ============================================================

DROP TABLE IF EXISTS grade CASCADE;
DROP TABLE IF EXISTS grade_summary CASCADE;
DROP TABLE IF EXISTS enrollment CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS counseling CASCADE;
DROP TABLE IF EXISTS student_record CASCADE;
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS approval_request CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS curriculum CASCADE;

-- ============================================================
-- Phase 2: ALTER (컬럼 수정만 필요한 테이블)
-- ============================================================

-- school
ALTER TABLE school DROP COLUMN IF EXISTS address;
ALTER TABLE school DROP COLUMN IF EXISTS phone;
ALTER TABLE school RENAME COLUMN name TO school_name;
ALTER TABLE school ADD COLUMN school_type VARCHAR(20) NOT NULL DEFAULT 'HIGH';
ALTER TABLE school ADD COLUMN school_code VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE school ALTER COLUMN school_type DROP DEFAULT;
ALTER TABLE school ALTER COLUMN school_code DROP DEFAULT;

-- class_group
ALTER TABLE class_group RENAME COLUMN year TO academic_year;
ALTER TABLE class_group DROP COLUMN IF EXISTS homeroom_teacher_id;

-- parent_student
ALTER TABLE parent_student RENAME COLUMN relation TO relationship;

-- attendance
ALTER TABLE attendance RENAME COLUMN date TO attend_date;

-- ============================================================
-- Phase 3: 재생성 (API 명세 기준)
-- ============================================================

CREATE TABLE curriculum (
    id              BIGSERIAL PRIMARY KEY,
    curriculum_name VARCHAR(50) NOT NULL,
    school_type     VARCHAR(20) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE course (
    id              BIGSERIAL PRIMARY KEY,
    curriculum_id   BIGINT NOT NULL REFERENCES curriculum(id),
    teacher_id      BIGINT NOT NULL REFERENCES teacher(id),
    school_id       BIGINT NOT NULL REFERENCES school(id),
    category        VARCHAR(20),
    course_name     VARCHAR(100) NOT NULL,
    academic_year   INT NOT NULL,
    semester        INT NOT NULL,
    midterm_ratio   INT NOT NULL DEFAULT 30,
    final_ratio     INT NOT NULL DEFAULT 40,
    task_ratio      INT NOT NULL DEFAULT 30,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE enrollment (
    id              BIGSERIAL PRIMARY KEY,
    course_id       BIGINT NOT NULL REFERENCES course(id),
    student_id      BIGINT NOT NULL REFERENCES student(id),
    enrolled_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE grade (
    id              BIGSERIAL PRIMARY KEY,
    enrollment_id   BIGINT NOT NULL REFERENCES enrollment(id),
    exam_type       VARCHAR(20) NOT NULL,
    score           DECIMAL(5,2) NOT NULL,
    max_score       DECIMAL(5,2) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE grade_summary (
    id              BIGSERIAL PRIMARY KEY,
    enrollment_id   BIGINT NOT NULL REFERENCES enrollment(id),
    raw_score       DECIMAL(5,2) NOT NULL,
    subject_avg     DECIMAL(5,2) NOT NULL,
    standard_dev    DECIMAL(5,2),
    achievement     VARCHAR(5) NOT NULL,
    rank            INT,
    grade_level     VARCHAR(5),
    num_students    INT NOT NULL,
    calculated_at   TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
    id                    BIGSERIAL PRIMARY KEY,
    student_id            BIGINT NOT NULL REFERENCES student(id),
    teacher_id            BIGINT NOT NULL REFERENCES teacher(id),
    course_id             BIGINT REFERENCES course(id),
    category              VARCHAR(20) NOT NULL,
    content               TEXT NOT NULL,
    is_public_to_student  BOOLEAN NOT NULL DEFAULT TRUE,
    is_public_to_parent   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE counseling (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL REFERENCES student(id),
    teacher_id      BIGINT NOT NULL REFERENCES teacher(id),
    counsel_date    DATE NOT NULL,
    main_content    TEXT NOT NULL,
    next_plan       TEXT,
    is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE student_record (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL REFERENCES student(id),
    academic_year   INT NOT NULL,
    semester        INT NOT NULL,
    special_note    TEXT,
    extracurricular TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_request (
    id              BIGSERIAL PRIMARY KEY,
    requester_id    BIGINT NOT NULL REFERENCES users(id),
    approver_id     BIGINT REFERENCES users(id),
    request_type    VARCHAR(30) NOT NULL,
    request_detail  TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    processed_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification (
    id                BIGSERIAL PRIMARY KEY,
    recipient_user_id BIGINT NOT NULL REFERENCES users(id),
    event_type        VARCHAR(30) NOT NULL,
    title             VARCHAR(200) NOT NULL,
    message           TEXT NOT NULL,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE report (
    id              BIGSERIAL PRIMARY KEY,
    requested_by    BIGINT NOT NULL REFERENCES users(id),
    report_type     VARCHAR(30) NOT NULL,
    file_format     VARCHAR(10) NOT NULL,
    file_path       VARCHAR(500),
    generated_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
