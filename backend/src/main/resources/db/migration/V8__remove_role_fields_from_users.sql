-- users 테이블에서 역할별 필드 제거 (school_name은 유지)
ALTER TABLE users DROP COLUMN IF EXISTS grade;
ALTER TABLE users DROP COLUMN IF EXISTS class_num;
ALTER TABLE users DROP COLUMN IF EXISTS student_num;
ALTER TABLE users DROP COLUMN IF EXISTS position;
ALTER TABLE users DROP COLUMN IF EXISTS homeroom_grade;
ALTER TABLE users DROP COLUMN IF EXISTS homeroom_class_num;

-- student 테이블: 가입→승인→학교배정 플로우를 위해 nullable로 복원
ALTER TABLE student ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE student ALTER COLUMN class_group_id DROP NOT NULL;
