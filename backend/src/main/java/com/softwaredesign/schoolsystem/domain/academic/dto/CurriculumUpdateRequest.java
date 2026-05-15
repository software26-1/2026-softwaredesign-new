package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CurriculumUpdateRequest {
    private String curriculumName;
    private SchoolType schoolType;
}