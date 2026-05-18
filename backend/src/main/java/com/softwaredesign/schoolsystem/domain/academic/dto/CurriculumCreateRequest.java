package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CurriculumCreateRequest {

    @NotBlank(message = "과목명은 필수입니다.")
    private String curriculumName;

    @NotNull(message = "과목구분은 필수입니다.")
    private SchoolType schoolType;
}
