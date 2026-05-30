-- AES-256-CBC 암호화 후 Base64 인코딩 시 최대 길이 대응 (256자로 확장)
ALTER TABLE users ALTER COLUMN resident_number TYPE VARCHAR(256);
