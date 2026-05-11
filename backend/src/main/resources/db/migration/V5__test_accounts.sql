-- 테스트용 계정 (Google OAuth 이메일 기반)
-- 기존 PENDING 계정이 있으면 TEACHER/ACTIVE로 업데이트, 없으면 INSERT
INSERT INTO users (email, name, role, status, created_at, updated_at)
VALUES ('rkdalstj0417@gmail.com', '테스트 선생님', 'TEACHER', 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO UPDATE
    SET role   = 'TEACHER',
        status = 'ACTIVE',
        name   = COALESCE(users.name, '테스트 선생님');
