-- course: category 컬럼을 course_type으로 변경
ALTER TABLE course RENAME COLUMN category TO course_type;

-- course: 중간/기말/과제 비율 합 100 제약조건 추가
ALTER TABLE course ADD CONSTRAINT chk_ratio_sum
    CHECK (midterm_ratio + final_ratio + task_ratio = 100);

-- enrollment: enrolled_at 컬럼 제거 (created_at으로 대체)
ALTER TABLE enrollment DROP COLUMN enrolled_at;
