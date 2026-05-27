package com.softwaredesign.schoolsystem.domain.notification.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.notification.dto.NotificationResponse;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(name = "is_read", required = false) Boolean isRead,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(notificationService.getByUser(authUser.id(), isRead));
    }

    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(notificationService.markRead(notificationId, authUser.id()));
    }
}
