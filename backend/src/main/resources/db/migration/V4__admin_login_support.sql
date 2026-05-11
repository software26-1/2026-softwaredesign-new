-- Admin 계정은 Google OAuth 없이 ID/Password 로그인
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN password VARCHAR(255);

-- 목데이터: teacher, student, parent (ACTIVE 상태)
INSERT INTO users (email, google_id, name, phone, role, status, school_name, position, homeroom_grade, homeroom_class_num, created_at, updated_at)
VALUES
    ('teacher@test.com', 'mock_teacher_001', '김담임', '010-1111-2222', 'TEACHER', 'ACTIVE', '시흥고등학교', 'HOMEROOM', 2, 3, NOW(), NOW()),
    ('student@test.com', 'mock_student_001', '홍길동', '010-3333-4444', 'STUDENT', 'ACTIVE', '시흥고등학교', NULL, NULL, NULL, NOW(), NOW()),
    ('parent@test.com',  'mock_parent_001',  '홍부모', '010-5555-6666', 'PARENT',  'ACTIVE', '시흥고등학교', NULL, NULL, NULL, NOW(), NOW());
