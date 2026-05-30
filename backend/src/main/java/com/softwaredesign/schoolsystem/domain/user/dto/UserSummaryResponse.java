package com.softwaredesign.schoolsystem.domain.user.dto;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserSummaryResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final String role;
    private final String status;
    private final String schoolName;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final String residentNumber;
    private final String position;

    public UserSummaryResponse(User user) {
        this(user, null);
    }

    public UserSummaryResponse(User user, String position) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phone = user.getPhone();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.status = user.getStatus().name();
        this.schoolName = user.getSchoolName();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        this.residentNumber = maskResidentNumber(user.getResidentNumber());
        this.position = position;
    }

    private static String maskResidentNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // raw is decrypted plain text: "YYMMDD-NNNNNNN"
        int dash = raw.indexOf('-');
        if (dash < 0 || raw.length() <= dash + 1) return raw;
        String front = raw.substring(0, dash);
        String back = raw.substring(dash + 1);
        String masked = back.isEmpty() ? "" : back.charAt(0) + "******";
        return front + "-" + masked;
    }
}
