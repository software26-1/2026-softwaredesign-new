package com.softwaredesign.schoolsystem.domain.notification.service;

import com.softwaredesign.schoolsystem.domain.notification.dto.NotificationResponse;
import com.softwaredesign.schoolsystem.domain.notification.entity.Notification;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.repository.NotificationRepository;
import com.softwaredesign.schoolsystem.domain.notification.sender.NotificationDispatcher;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationDispatcher dispatcher;

    @Transactional
    public NotificationResponse create(Long recipientUserId, NotificationEventType eventType,
                                       String title, String message) {
        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다."));
        Notification notification = Notification.create(recipient, eventType, title, message);
        notificationRepository.save(notification);
        // Persistence is the source of truth; external delivery is best-effort.
        try {
            dispatcher.dispatch(recipient, title, message);
        } catch (Exception e) {
            log.error("[notification] external dispatch failed for user={}: {}",
                    recipientUserId, e.getMessage());
        }
        return NotificationResponse.from(notification);
    }

    /**
     * 다른 도메인에서 알림을 발송할 때 호출하는 헬퍼.
     *
     * <p>REQUIRES_NEW: AFTER_COMMIT 이벤트 리스너(피드백/성적 알림)에서 호출될 때는
     * 활성 트랜잭션이 없으므로 새 트랜잭션을 강제해야 알림이 실제로 커밋된다.
     * (REQUIRED면 afterCommit 단계에서 INSERT가 커밋되지 않아 알림이 유실됨.)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notify(Long recipientUserId, NotificationEventType eventType,
                       String title, String message) {
        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다."));
        Notification notification = Notification.create(recipient, eventType, title, message);
        notificationRepository.save(notification);
        try {
            dispatcher.dispatch(recipient, title, message);
        } catch (Exception e) {
            log.error("[notification] external dispatch failed for user={}: {}",
                    recipientUserId, e.getMessage());
        }
    }

    public List<NotificationResponse> getByUser(Long userId, Boolean isReadOrNull) {
        List<Notification> list = (isReadOrNull == null)
                ? notificationRepository.findByRecipientId(userId)
                : notificationRepository.findByRecipientIdAndIsRead(userId, isReadOrNull);
        return list.stream().map(NotificationResponse::from).toList();
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new AccessDeniedException("본인의 알림만 읽음 처리할 수 있습니다.");
        }
        notification.markAsRead();
        return NotificationResponse.from(notification);
    }
}
