-- V24__fix_grade_student_id_nulls.sql
-- grade.student_id nullable 컬럼 정리
--
-- 배경:
--   V22에서 grade.student_id 컬럼을 추가하고 enrollment→student 역참조로 채웠으나,
--   enrollment.student_id 자체가 NULL인 경우(수강취소 후 소프트딜리트된 enrollment 등)
--   역채우기가 완전하지 않을 수 있다.
--
-- 조치:
--   1. student_id가 NULL이면 enrollment 경유로 재보정
--   2. 여전히 NULL인 행(enrollment도 없거나 student도 없는 고아 행)은 삭제
--   3. 향후 신규 grade는 createGrade() 에서 항상 student를 세팅하므로 NULL 방지

-- Step 1: enrollment 경유로 student_id 재보정
UPDATE grade g
SET student_id = e.student_id
FROM enrollment e
WHERE g.enrollment_id = e.id
  AND g.student_id IS NULL
  AND e.student_id IS NOT NULL;

-- Step 2: 여전히 student_id가 NULL인 고아 grade 행 삭제
--   (enrollment 자체가 없거나 enrollment.student_id도 NULL인 데이터)
DELETE FROM grade
WHERE student_id IS NULL;
