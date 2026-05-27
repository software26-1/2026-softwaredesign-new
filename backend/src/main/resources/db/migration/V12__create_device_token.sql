-- V12__create_device_token.sql
-- Per-user FCM device/registration token registry. Required so the push channel
-- can address real devices via FirebaseMessaging. A user may have multiple active
-- devices (web, mobile), hence the one-to-many. The token itself is globally
-- unique (FCM tokens are device+app scoped), so we enforce a unique constraint
-- and upsert on (re)registration instead of inserting duplicates.

CREATE TABLE IF NOT EXISTS device_token (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    token           VARCHAR(512) NOT NULL,
    platform        VARCHAR(20),
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT uq_device_token_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_device_token_user ON device_token (user_id);
