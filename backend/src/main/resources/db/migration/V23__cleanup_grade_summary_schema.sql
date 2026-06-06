-- V23__cleanup_grade_summary_schema.sql
-- grade_summary 테이블 이중 구조 정리
--
-- 배경:
--   V3: student_id, class_group_id, year, semester, average_score, rank 기반으로 설계
--   V6: DROP 후 enrollment_id, raw_score, subject_avg 등 다른 구조로 재생성
--   V22: 엔티티(V3 구조) 기준으로 student_id, class_group_id, year, semester, average_score 컬럼 재추가
--
-- 현재 상태:
--   - V22로 추가된 컬럼(student_id, class_group_id, year, semester, average_score)이 Java 서비스/엔티티에서 사용됨
--   - V6 잔여 컬럼(enrollment_id, raw_score, subject_avg, standard_dev, achievement,
--     grade_level, num_students, calculated_at)은 어떤 Java 코드도 참조하지 않음
--   - ETL(AnalyticsEtlService)은 grade_summary를 전혀 사용하지 않음 (analytics.* 전용)
--
-- 조치:
--   1. V6 잔여 컬럼 제거
--   2. V22에서 nullable로 추가된 컬럼들에 NOT NULL 제약 추가
--   3. 인덱스 추가 (서비스 쿼리 기준)

-- ============================================================
-- Step 1: V6 잔여 컬럼 제거 (Java 코드에서 미사용)
-- ============================================================

ALTER TABLE grade_summary DROP COLUMN IF EXISTS enrollment_id;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS raw_score;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS subject_avg;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS standard_dev;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS achievement;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS grade_level;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS num_students;
ALTER TABLE grade_summary DROP COLUMN IF EXISTS calculated_at;

-- ============================================================
-- Step 2: NULL 데이터 보정 후 NOT NULL 제약 추가
-- (V22의 UPDATE가 enrollment → student 역참조로 채웠지만, 기존 데이터가 없을 수도 있음)
-- ============================================================

-- student_id가 NULL인 행 제거 (역참조 실패 또는 고아 행)
DELETE FROM grade_summary WHERE student_id IS NULL;

-- class_group_id가 NULL인 행은 student의 class_group_id로 재보정
UPDATE grade_summary gs
SET class_group_id = s.class_group_id
FROM student s
WHERE gs.student_id = s.id
  AND gs.class_group_id IS NULL
  AND s.class_group_id IS NOT NULL;

-- 여전히 class_group_id가 NULL인 행 제거 (학급 미배정 학생의 고아 요약)
DELETE FROM grade_summary WHERE class_group_id IS NULL;

-- year/semester가 NULL인 행 제거
DELETE FROM grade_summary WHERE year IS NULL OR semester IS NULL;

-- average_score가 NULL이면 0으로 보정 (rank는 nullable 유지)
UPDATE grade_summary SET average_score = 0 WHERE average_score IS NULL;

-- NOT NULL 제약 추가
ALTER TABLE grade_summary ALTER COLUMN student_id    SET NOT NULL;
ALTER TABLE grade_summary ALTER COLUMN class_group_id SET NOT NULL;
ALTER TABLE grade_summary ALTER COLUMN year           SET NOT NULL;
ALTER TABLE grade_summary ALTER COLUMN semester       SET NOT NULL;
ALTER TABLE grade_summary ALTER COLUMN average_score  SET NOT NULL;

-- ============================================================
-- Step 3: 서비스 쿼리 기준 인덱스 추가
-- GradeSummaryRepository:
--   findByClassGroupIdAndYearAndSemester  -> (class_group_id, year, semester)
--   findByStudentIdAndYearAndSemester     -> (student_id, year, semester)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_grade_summary_class_term
    ON grade_summary (class_group_id, year, semester);

CREATE INDEX IF NOT EXISTS idx_grade_summary_student_term
    ON grade_summary (student_id, year, semester);
