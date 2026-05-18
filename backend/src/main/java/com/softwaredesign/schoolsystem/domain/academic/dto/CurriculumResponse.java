package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class CurriculumResponse {
    private final Long id;
    private final String curriculumName;
    private final SchoolType schoolType;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static CurriculumResponse from(Curriculum curriculum) {
        return new CurriculumResponse(
                curriculum.getId(),
                curriculum.getCurriculumName(),
                curriculum.getSchoolType(),
                curriculum.getCreatedAt(),
                curriculum.getUpdatedAt()
        );
    }
}
