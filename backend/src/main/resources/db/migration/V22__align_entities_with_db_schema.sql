-- V22__align_entities_with_db_schema.sql
-- JPA 엔티티와 DB 스키마 불일치 항목 일괄 정렬
-- 기본 방향: 이미 서비스/DTO가 엔티티 기준으로 완성되어 있으므로
--            DB 컬럼을 엔티티에 맞게 수정하고, 엔티티에만 있는 컬럼은 DB에 추가한다.

-- ============================================================
-- 1. grade 테이블
--    - student_id 컬럼 추가 (엔티티에 @JoinColumn(name="student_id") 존재)
--    - exam_type -> grade_type 리네임 (엔티티 필드: gradeType, @Column 기본명 grade_type)
--    - score NOT NULL 해제 (엔티티에서 nullable)
-- ============================================================

ALTER TABLE grade ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES student(id);

-- 기존 데이터: enrollment -> student 역참조로 student_id 채우기
UPDATE grade g
SET student_id = e.student_id
FROM enrollment e
WHERE g.enrollment_id = e.id
  AND g.student_id IS NULL;

-- exam_type 컬럼을 grade_type 으로 리네임
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'grade' AND column_name = 'exam_type'
    ) THEN
        ALTER TABLE grade RENAME COLUMN exam_type TO grade_type;
    END IF;
END$$;

-- score 의 NOT NULL 제약 해제 (엔티티에서 nullable)
ALTER TABLE grade ALTER COLUMN score DROP NOT NULL;

-- ============================================================
-- 2. grade_summary 테이블
--    현재 DB: enrollment_id 기준 (V6 구조)
--    엔티티:  student_id, class_group_id, year, semester, average_score, rank 기준 (V3 구조)
--    서비스:  findByClassGroupIdAndYearAndSemester, findByStudentIdAndYearAndSemester 사용
--    -> 엔티티/서비스 구조에 맞게 DB 컬럼을 추가하고, V6 컬럼은 호환성을 위해 유지
-- ============================================================

ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS student_id    BIGINT REFERENCES student(id);
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS class_group_id BIGINT REFERENCES class_group(id);
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS year           INT;
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS semester       INT;
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS average_score  DECIMAL(5,2);

-- 기존 enrollment_id 기반 데이터로 student_id / year / semester 역채우기
UPDATE grade_summary gs
SET student_id    = e.student_id,
    year          = c.academic_year,
    semester      = c.semester
FROM enrollment e
JOIN course c ON e.course_id = c.id
WHERE gs.enrollment_id = e.id
  AND gs.student_id IS NULL;

-- average_score 초기값: raw_score 복사 (근사치)
UPDATE grade_summary
SET average_score = raw_score
WHERE average_score IS NULL AND raw_score IS NOT NULL;

-- ============================================================
-- 3. counseling 테이블
--    현재 DB: counsel_date DATE, main_content TEXT
--    엔티티:  counseledAt (LocalDateTime) -> counseled_at TIMESTAMP,
--             content TEXT
--    -> DB 컬럼을 엔티티에 맞게 수정
-- ============================================================

-- counsel_date DATE -> counseled_at TIMESTAMP
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'counseling' AND column_name = 'counsel_date'
    ) THEN
        ALTER TABLE counseling RENAME COLUMN counsel_date TO counseled_at;
        -- DATE를 TIMESTAMP로 타입 변경 (기존 날짜 데이터 보존)
        ALTER TABLE counseling ALTER COLUMN counseled_at TYPE TIMESTAMP
            USING counseled_at::TIMESTAMP;
    END IF;
END$$;

-- main_content -> content
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'counseling' AND column_name = 'main_content'
    ) THEN
        ALTER TABLE counseling RENAME COLUMN main_content TO content;
    END IF;
END$$;

-- ============================================================
-- 4. feedback 테이블
--    현재 DB: is_public_to_student, is_public_to_parent, category NOT NULL
--    엔티티:  visibleToStudent (visible_to_student), visibleToParent (visible_to_parent), type (nullable)
--    -> DB 컬럼을 엔티티에 맞게 수정
-- ============================================================

-- is_public_to_student -> visible_to_student
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback' AND column_name = 'is_public_to_student'
    ) THEN
        ALTER TABLE feedback RENAME COLUMN is_public_to_student TO visible_to_student;
    END IF;
END$$;

-- is_public_to_parent -> visible_to_parent
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback' AND column_name = 'is_public_to_parent'
    ) THEN
        ALTER TABLE feedback RENAME COLUMN is_public_to_parent TO visible_to_parent;
    END IF;
END$$;

-- category -> type, NOT NULL 해제 (엔티티에서 nullable)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback' AND column_name = 'category'
    ) THEN
        ALTER TABLE feedback RENAME COLUMN category TO type;
    END IF;
END$$;

ALTER TABLE feedback ALTER COLUMN type DROP NOT NULL;

-- ============================================================
-- 5. student_record 테이블
--    현재 DB: special_note TEXT, (volunteer_hours / career_aspirations / achievements 없음)
--    엔티티:  achievements TEXT, extracurricular TEXT, volunteerHours INT, careerAspirations TEXT
--    -> DB에 누락 컬럼 추가, special_note -> achievements 리네임
-- ============================================================

-- special_note -> achievements
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'student_record' AND column_name = 'special_note'
    ) THEN
        ALTER TABLE student_record RENAME COLUMN special_note TO achievements;
    END IF;
END$$;

ALTER TABLE student_record ADD COLUMN IF NOT EXISTS volunteer_hours   INT NOT NULL DEFAULT 0;
ALTER TABLE student_record ADD COLUMN IF NOT EXISTS career_aspirations TEXT;
