-- V22__add_operational_indexes.sql
-- 부하/동시 접속 대비 운영 테이블 인덱스 추가 (비기능 요구사항 N3-1: 다수 교사 동시 접속)
--
-- 배경:
--   PostgreSQL은 PRIMARY KEY 에는 인덱스를 자동 생성하지만 FOREIGN KEY 에는 만들지 않는다.
--   운영 테이블(grade, feedback, counseling, attendance, enrollment, notification,
--   student, student_record)은 student_id 등 FK 컬럼으로 조회가 빈번한데 인덱스가 없어
--   매 조회가 풀 테이블 스캔이 된다. 데이터가 쌓이고 동시 요청이 늘면 급격히 느려진다.
--
-- 조치:
--   자주 WHERE/JOIN 에 쓰이는 FK·필터 컬럼에 인덱스를 추가한다.
--   소프트삭제(is_deleted) 테이블은 (fk, is_deleted) 복합 인덱스로 활성 행 조회를 가속한다.
--   IF NOT EXISTS 로 멱등하게 작성(재실행 안전).

-- grade: 학생별/수강별 성적 조회
CREATE INDEX IF NOT EXISTS idx_grade_enrollment ON grade (enrollment_id);

-- enrollment: 학생별 수강 목록, 과목별 수강생 (소프트삭제 대상)
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment (student_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_enrollment_course  ON enrollment (course_id, is_deleted);

-- feedback: 학생별 피드백 조회 + 교사/과목 필터
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback (student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_teacher ON feedback (teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedback_course  ON feedback (course_id);

-- counseling: 학생별/교사별 상담 조회
CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling (student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_teacher ON counseling (teacher_id);

-- attendance: 학생별/학급별 출결 조회
CREATE INDEX IF NOT EXISTS idx_attendance_student     ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_group ON attendance (class_group_id);

-- student_record: 학생별 학생부 조회
CREATE INDEX IF NOT EXISTS idx_student_record_student ON student_record (student_id);

-- notification: 수신자별 알림 조회(읽음 필터 포함) — 폴링으로 자주 호출됨
CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification (recipient_user_id, is_read);

-- student: 학교/학급별 학생 목록 (소프트삭제 대상)
CREATE INDEX IF NOT EXISTS idx_student_school      ON student (school_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_student_class_group ON student (class_group_id, is_deleted);

-- course: 학교/교사별 개설과목 조회 (소프트삭제 대상)
CREATE INDEX IF NOT EXISTS idx_course_school  ON course (school_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_course_teacher ON course (teacher_id);

-- approval_request: 승인자/요청자별 승인 목록
CREATE INDEX IF NOT EXISTS idx_approval_approver  ON approval_request (approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requester ON approval_request (requester_id);

-- parent_student: 학부모-자녀 매핑 양방향 조회
CREATE INDEX IF NOT EXISTS idx_parent_student_parent  ON parent_student (parent_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student (student_id, is_deleted);
