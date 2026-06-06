-- V24__student_record_per_semester.sql
-- 학생부 학년/학기별 누적 보존 지원
--
-- 배경:
--   학생부(student_record)를 학생당 1건이 아니라 학년/학기별로 누적 보존하도록 변경.
--   엔티티가 @OneToOne(unique) → @ManyToOne 으로 바뀌어 한 학생에 여러 레코드가 허용된다.
--   V6 재생성 시 student_id 의 UNIQUE 제약은 이미 제거된 상태이므로, 기존 데이터는 그대로 보존된다.
--
-- 조치:
--   1. (student_id, academic_year, semester) 복합 UNIQUE 제약 추가
--      → 같은 학생의 같은 학기 학생부 중복 방지(서비스 upsert 키와 일치)
--   2. 학생별 조회/이력 정렬용 인덱스 추가
--
--   기존에 학생당 1건만 있던 데이터는 (student_id, academic_year, semester) 가 모두 유니크하므로
--   제약 추가 시 충돌 없이 적용된다. 데이터 삭제/변경 없음.

-- 1) 복합 UNIQUE (멱등: 이미 있으면 건너뜀)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_record_term'
    ) THEN
        ALTER TABLE student_record
            ADD CONSTRAINT uq_student_record_term
            UNIQUE (student_id, academic_year, semester);
    END IF;
END$$;

-- 2) 학생별 이력 조회 인덱스 (복합 UNIQUE 가 student_id 선두라 별도 인덱스는 보조적이나,
--    최신 학기 정렬 조회 가속을 위해 명시)
CREATE INDEX IF NOT EXISTS idx_student_record_student_term
    ON student_record (student_id, academic_year DESC, semester DESC);
