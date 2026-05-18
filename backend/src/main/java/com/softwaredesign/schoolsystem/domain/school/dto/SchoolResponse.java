package com.softwaredesign.schoolsystem.domain.school.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class SchoolResponse {
    private final Long id;
    private final String schoolName;
    private final SchoolType schoolType;
    private final String schoolCode;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static SchoolResponse from(School school) {
        return new SchoolResponse(
                school.getId(),
                school.getSchoolName(),
                school.getSchoolType(),
                school.getSchoolCode(),
                school.getCreatedAt(),
                school.getUpdatedAt()
        );
    }
}
