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

    public UserSummaryResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phone = user.getPhone();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.status = user.getStatus().name();
        this.schoolName = user.getSchoolName();
        this.createdAt = user.getCreatedAt();
    }
}
