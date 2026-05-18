package com.softwaredesign.schoolsystem.domain.school.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SchoolCreateRequest {
    @NotBlank(message = "학교명은 필수입니다.") // String 전용
    private String schoolName;

    @NotNull(message = "학교 구분은 필수입니다.") // Enum 등
    private SchoolType schoolType;

    @NotBlank(message = "학교 코드는 필수입니다.")
    private String schoolCode;
}
