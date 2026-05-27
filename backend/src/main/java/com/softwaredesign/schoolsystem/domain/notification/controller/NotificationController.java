package com.softwaredesign.schoolsystem.domain.notification.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.notification.dto.DeviceTokenRequest;
import com.softwaredesign.schoolsystem.domain.notification.dto.NotificationResponse;
import com.softwaredesign.schoolsystem.domain.notification.service.DeviceTokenService;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import jakarta.validation.Valid;
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
    private final DeviceTokenService deviceTokenService;

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

    @PostMapping("/device-tokens")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> registerDeviceToken(
            @Valid @RequestBody DeviceTokenRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        deviceTokenService.register(authUser.id(), request.getToken(), request.getPlatform());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/device-tokens")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unregisterDeviceToken(
            @Valid @RequestBody DeviceTokenRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        deviceTokenService.unregister(authUser.id(), request.getToken());
        return ResponseEntity.noContent().build();
    }
}
