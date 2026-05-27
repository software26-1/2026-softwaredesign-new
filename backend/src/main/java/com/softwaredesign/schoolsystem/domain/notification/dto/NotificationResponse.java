package com.softwaredesign.schoolsystem.domain.notification.dto;

import com.softwaredesign.schoolsystem.domain.notification.entity.Notification;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class NotificationResponse {
    private final Long id;
    private final NotificationEventType eventType;
    private final String title;
    private final String message;
    private final boolean isRead;
    private final LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getEventType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
