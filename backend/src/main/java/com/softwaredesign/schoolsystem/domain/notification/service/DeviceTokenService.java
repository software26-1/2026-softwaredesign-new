package com.softwaredesign.schoolsystem.domain.notification.service;

import com.softwaredesign.schoolsystem.domain.notification.entity.DeviceToken;
import com.softwaredesign.schoolsystem.domain.notification.repository.DeviceTokenRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages the per-user FCM device-token registry. Registration is idempotent:
 * re-registering an existing token re-points it to the current user instead of
 * creating a duplicate (FCM tokens are globally unique per device+app).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public void register(Long userId, String token, String platform) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        deviceTokenRepository.findByToken(token)
                .ifPresentOrElse(
                        existing -> existing.reassign(user, platform),
                        () -> deviceTokenRepository.save(DeviceToken.create(user, token, platform)));
    }

    @Transactional
    public void unregister(Long userId, String token) {
        deviceTokenRepository.findByToken(token).ifPresent(existing -> {
            if (!existing.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("본인의 기기 토큰만 해제할 수 있습니다.");
            }
            deviceTokenRepository.delete(existing);
        });
    }

    public List<String> tokensForUser(Long userId) {
        return deviceTokenRepository.findByUserId(userId).stream()
                .map(DeviceToken::getToken)
                .toList();
    }
}
