-- V23__align_schema_with_entities.sql
-- JPA 엔티티 ↔ DB 스키마 정합 (5번/7번)
--
-- 배경:
--   V6(align_schema_with_api_spec)가 일부 테이블을 API 명세 기준으로 재정의하면서
--   이후 작성된 JPA 엔티티의 기대 컬럼명과 어긋났다. ddl-auto: none 이므로 Flyway 스키마가
--   그대로 사용되어, 깨끗한 DB에 Flyway 만으로 기동하면 grade/feedback/counseling/
--   student_record/grade_summary 의 조회·저장이 "컬럼 없음"으로 런타임 실패한다.
--
-- 방침(데이터 보존 우선):
--   - 파괴적 연산(컬럼 DROP, 행 DELETE) 금지.
--   - 컬럼명 불일치는 RENAME(데이터 보존), 누락 컬럼은 ADD + 기존데이터 백필.
--   - 엔티티가 채우지 않는 레거시 NOT NULL 컬럼은 DROP 대신 NOT NULL 해제(향후 INSERT 안전).
--   - 모든 RENAME 은 컬럼 존재 여부를 확인하는 DO 블록으로 감싸 재실행 안전(멱등).
--
-- 자바 코드 변경 없음: 엔티티들은 모두 camelCase→snake_case 기본 명명을 기대하므로
--   DB 컬럼을 그 이름에 맞추면 그대로 동작한다.

-- 헬퍼: 컬럼 RENAME (대상 컬럼이 있고 새 이름이 없을 때만)
-- (PostgreSQL 익명 DO 블록으로 인라인 처리)

-- ============================================================
-- 1. grade : enrollment_id+exam_type → +student_id, grade_type, score nullable
-- ============================================================
ALTER TABLE grade ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES student(id);

UPDATE grade g
SET student_id = e.student_id
FROM enrollment e
WHERE g.enrollment_id = e.id AND g.student_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='grade' AND column_name='exam_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='grade' AND column_name='grade_type') THEN
    ALTER TABLE grade RENAME COLUMN exam_type TO grade_type;
  END IF;
END$$;

ALTER TABLE grade ALTER COLUMN score DROP NOT NULL;

-- ============================================================
-- 2. feedback : is_public_to_* → visible_to_*, category → type
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='is_public_to_student')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='visible_to_student') THEN
    ALTER TABLE feedback RENAME COLUMN is_public_to_student TO visible_to_student;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='is_public_to_parent')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='visible_to_parent') THEN
    ALTER TABLE feedback RENAME COLUMN is_public_to_parent TO visible_to_parent;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='category')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='feedback' AND column_name='type') THEN
    ALTER TABLE feedback RENAME COLUMN category TO type;
  END IF;
END$$;

-- ============================================================
-- 3. counseling : counsel_date(DATE) → counseled_at(TIMESTAMP), main_content → content
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='counseling' AND column_name='counsel_date')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='counseling' AND column_name='counseled_at') THEN
    ALTER TABLE counseling ALTER COLUMN counsel_date TYPE TIMESTAMP USING counsel_date::timestamp;
    ALTER TABLE counseling RENAME COLUMN counsel_date TO counseled_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='counseling' AND column_name='main_content')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='counseling' AND column_name='content') THEN
    ALTER TABLE counseling RENAME COLUMN main_content TO content;
  END IF;
END$$;

-- ============================================================
-- 4. student_record : special_note → achievements, +volunteer_hours, +career_aspirations
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='student_record' AND column_name='special_note')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='student_record' AND column_name='achievements') THEN
    ALTER TABLE student_record RENAME COLUMN special_note TO achievements;
  END IF;
END$$;

ALTER TABLE student_record ADD COLUMN IF NOT EXISTS volunteer_hours    INT NOT NULL DEFAULT 0;
ALTER TABLE student_record ADD COLUMN IF NOT EXISTS career_aspirations TEXT;

-- ============================================================
-- 5. grade_summary : V6(enrollment_id 기준) → 엔티티(student_id,year,semester,average_score)
--    레거시 NOT NULL 컬럼은 DROP 하지 않고 NOT NULL 만 해제(데이터 보존 + 향후 INSERT 안전)
-- ============================================================
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS student_id     BIGINT REFERENCES student(id);
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS class_group_id BIGINT REFERENCES class_group(id);
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS year           INT;
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS semester       INT;
ALTER TABLE grade_summary ADD COLUMN IF NOT EXISTS average_score  DECIMAL(5,2);

-- 기존 enrollment_id 기반 데이터를 엔티티 구조로 백필
UPDATE grade_summary gs
SET student_id   = e.student_id,
    year         = c.academic_year,
    semester     = c.semester,
    average_score = COALESCE(gs.average_score, gs.raw_score)
FROM enrollment e
JOIN course c ON e.course_id = c.id
WHERE gs.enrollment_id = e.id AND gs.student_id IS NULL;

-- 레거시 NOT NULL 해제 (엔티티가 채우지 않는 V6 컬럼들)
DO $$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['enrollment_id','raw_score','subject_avg','achievement','num_students','calculated_at']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='grade_summary' AND column_name=col AND is_nullable='NO') THEN
      EXECUTE format('ALTER TABLE grade_summary ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;
END$$;
