-- V7__add_is_deleted_and_fix_constraints.sql
-- ERD(design/ERD.sql) 기준으로 soft-delete 컬럼 추가 및 student 테이블 제약조건 수정

-- ============================================================
-- Section 1: Add is_deleted column to tables that are missing it
-- ============================================================

-- school: ERD에 is_deleted 존재, 현재 스키마에 없음
ALTER TABLE school ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- class_group: ERD에 is_deleted 존재, 현재 스키마에 없음
ALTER TABLE class_group ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- student: ERD에는 is_deleted가 명시되지 않았지만 soft-delete 패턴 일관성을 위해 추가
ALTER TABLE student ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- parent_student: ERD에 is_deleted 존재, 현재 스키마에 없음
ALTER TABLE parent_student ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- parent: ERD에는 is_deleted가 명시되지 않았지만 soft-delete 패턴 일관성을 위해 추가
ALTER TABLE parent ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- Section 2: Fix student table constraints to match ERD
-- ERD 정의: school_id BIGINT NOT NULL, class_group_id BIGINT NOT NULL,
--           student_number INT NOT NULL, birth_date 컬럼 없음
-- ============================================================

-- school_id: nullable -> NOT NULL (ERD 기준)
-- 기존 NULL 값이 있을 수 있으므로 0으로 채운 뒤 NOT NULL 제약 설정
UPDATE student SET school_id = 0 WHERE school_id IS NULL;
ALTER TABLE student ALTER COLUMN school_id SET NOT NULL;

-- class_group_id: nullable -> NOT NULL (ERD 기준)
UPDATE student SET class_group_id = 0 WHERE class_group_id IS NULL;
ALTER TABLE student ALTER COLUMN class_group_id SET NOT NULL;

-- student_number: nullable -> NOT NULL (ERD 기준)
UPDATE student SET student_number = 0 WHERE student_number IS NULL;
ALTER TABLE student ALTER COLUMN student_number SET NOT NULL;

-- birth_date: ERD에 존재하지 않는 컬럼이므로 삭제
ALTER TABLE student DROP COLUMN IF EXISTS birth_date;
