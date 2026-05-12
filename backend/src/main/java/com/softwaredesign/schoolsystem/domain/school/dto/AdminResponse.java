package com.softwaredesign.schoolsystem.domain.school.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AdminResponse {
    private final Long id;
    private final Long userId;
    private final String name;
    private final String email;
    private final Long schoolId;
    private final String schoolName;
    private final LocalDateTime createdAt;

    public static AdminResponse from(Admin admin) {
        return new AdminResponse(
                admin.getId(),
                admin.getUser().getId(),
                admin.getUser().getName(),
                admin.getUser().getEmail(),
                admin.getSchool() != null ? admin.getSchool().getId() : null,
                admin.getSchool() != null ? admin.getSchool().getSchoolName() : null,
                admin.getCreatedAt()
        );
    }
}
