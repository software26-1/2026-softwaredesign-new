-- school
CREATE TABLE school (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    address    VARCHAR(255),
    phone      VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- teacher
CREATE TABLE teacher (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id),
    school_id  BIGINT REFERENCES school(id),
    position   VARCHAR(20),             -- HOMEROOM, SUBJECT, NON_SUBJECT
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- class_group (학급)
CREATE TABLE class_group (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES school(id),
    year                INT NOT NULL,
    grade               INT NOT NULL,
    class_number        INT NOT NULL,
    homeroom_teacher_id BIGINT REFERENCES teacher(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- student
CREATE TABLE student (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL UNIQUE REFERENCES users(id),
    school_id      BIGINT REFERENCES school(id),
    class_group_id BIGINT REFERENCES class_group(id),
    student_number INT,
    birth_date     DATE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- parent
CREATE TABLE parent (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- admin
CREATE TABLE admin (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id),
    school_id  BIGINT REFERENCES school(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- parent_student (학부모-학생 매핑)
CREATE TABLE parent_student (
    id         BIGSERIAL PRIMARY KEY,
    parent_id  BIGINT NOT NULL REFERENCES parent(id),
    student_id BIGINT NOT NULL REFERENCES student(id),
    relation   VARCHAR(20),             -- FATHER, MOTHER, GUARDIAN
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (parent_id, student_id)
);

-- curriculum (교과)
CREATE TABLE curriculum (
    id         BIGSERIAL PRIMARY KEY,
    school_id  BIGINT REFERENCES school(id),
    name       VARCHAR(100) NOT NULL,   -- 수학, 영어, 국어 등
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- course (과목)
CREATE TABLE course (
    id            BIGSERIAL PRIMARY KEY,
    curriculum_id BIGINT NOT NULL REFERENCES curriculum(id),
    name          VARCHAR(100) NOT NULL, -- 미적분2, 확률과통계 등
    credits       INT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- enrollment (수업 편성: 교사-과목-학급)
CREATE TABLE enrollment (
    id             BIGSERIAL PRIMARY KEY,
    teacher_id     BIGINT NOT NULL REFERENCES teacher(id),
    course_id      BIGINT NOT NULL REFERENCES course(id),
    class_group_id BIGINT NOT NULL REFERENCES class_group(id),
    year           INT NOT NULL,
    semester       INT NOT NULL,        -- 1, 2
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, course_id, class_group_id, year, semester)
);

-- grade (성적)
CREATE TABLE grade (
    id            BIGSERIAL PRIMARY KEY,
    student_id    BIGINT NOT NULL REFERENCES student(id),
    enrollment_id BIGINT NOT NULL REFERENCES enrollment(id),
    score         DECIMAL(5,2),
    grade_type    VARCHAR(20),          -- MIDTERM, FINAL, ASSIGNMENT
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- grade_summary (성적 요약)
CREATE TABLE grade_summary (
    id             BIGSERIAL PRIMARY KEY,
    student_id     BIGINT NOT NULL REFERENCES student(id),
    class_group_id BIGINT NOT NULL REFERENCES class_group(id),
    year           INT NOT NULL,
    semester       INT NOT NULL,
    average_score  DECIMAL(5,2),
    rank           INT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- attendance (출결)
CREATE TABLE attendance (
    id             BIGSERIAL PRIMARY KEY,
    student_id     BIGINT NOT NULL REFERENCES student(id),
    class_group_id BIGINT NOT NULL REFERENCES class_group(id),
    date           DATE NOT NULL,
    status         VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, LATE, EARLY_LEAVE
    reason         TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- feedback
CREATE TABLE feedback (
    id                    BIGSERIAL PRIMARY KEY,
    teacher_id            BIGINT NOT NULL REFERENCES teacher(id),
    student_id            BIGINT NOT NULL REFERENCES student(id),
    content               TEXT NOT NULL,
    type                  VARCHAR(20),  -- ACADEMIC, BEHAVIOR, ATTENDANCE, ATTITUDE
    visible_to_student    BOOLEAN NOT NULL DEFAULT TRUE,
    visible_to_parent     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- counseling (상담)
CREATE TABLE counseling (
    id           BIGSERIAL PRIMARY KEY,
    teacher_id   BIGINT NOT NULL REFERENCES teacher(id),
    student_id   BIGINT NOT NULL REFERENCES student(id),
    counseled_at TIMESTAMP NOT NULL,
    content      TEXT NOT NULL,
    next_plan    TEXT,
    is_shared    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- student_record (학생부)
CREATE TABLE student_record (
    id                 BIGSERIAL PRIMARY KEY,
    student_id         BIGINT NOT NULL UNIQUE REFERENCES student(id),
    achievements       TEXT,            -- 교과 세부능력 특기사항
    extracurricular    TEXT,            -- 창체 활동
    volunteer_hours    INT DEFAULT 0,
    career_aspirations TEXT,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- approval_request (승인 요청)
CREATE TABLE approval_request (
    id           BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id),
    approver_id  BIGINT REFERENCES users(id),
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reject_reason TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- notification
CREATE TABLE notification (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    title      VARCHAR(200) NOT NULL,
    content    TEXT,
    type       VARCHAR(30),             -- GRADE_UPDATE, FEEDBACK, COUNSELING, APPROVAL
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- report (보고서)
CREATE TABLE report (
    id         BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teacher(id),
    student_id BIGINT NOT NULL REFERENCES student(id),
    title      VARCHAR(200) NOT NULL,
    content    TEXT,
    type       VARCHAR(20),             -- PDF, EXCEL
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
