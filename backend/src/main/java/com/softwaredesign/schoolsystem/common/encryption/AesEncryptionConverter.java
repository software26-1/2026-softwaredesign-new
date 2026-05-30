package com.softwaredesign.schoolsystem.common.encryption;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-CBC encryption for sensitive PII fields (주민등록번호).
 * The IV is prepended to the ciphertext (Base64) so each stored value is unique.
 * Key must be exactly 32 bytes; pad/truncate if needed via AES_SECRET_KEY env var.
 */
@Component
@Converter
public class AesEncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_BYTES = 16;

    private final SecretKeySpec secretKey;

    public AesEncryptionConverter(@Value("${app.aes.secret-key:01234567890123456789012345678901}") String rawKey) {
        byte[] keyBytes = rawKey.getBytes(StandardCharsets.UTF_8);
        byte[] key = new byte[32];
        System.arraycopy(keyBytes, 0, key, 0, Math.min(keyBytes.length, 32));
        this.secretKey = new SecretKeySpec(key, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String plain) {
        if (plain == null || plain.isBlank()) return plain;
        try {
            byte[] iv = new byte[IV_BYTES];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[IV_BYTES + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_BYTES);
            System.arraycopy(encrypted, 0, combined, IV_BYTES, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("주민등록번호 암호화 실패", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String stored) {
        if (stored == null || stored.isBlank()) return stored;
        try {
            byte[] combined = Base64.getDecoder().decode(stored);
            byte[] iv = new byte[IV_BYTES];
            byte[] encrypted = new byte[combined.length - IV_BYTES];
            System.arraycopy(combined, 0, iv, 0, IV_BYTES);
            System.arraycopy(combined, IV_BYTES, encrypted, 0, encrypted.length);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // 기존 평문 데이터 호환 (마이그레이션 전 데이터)
            return stored;
        }
    }
}
