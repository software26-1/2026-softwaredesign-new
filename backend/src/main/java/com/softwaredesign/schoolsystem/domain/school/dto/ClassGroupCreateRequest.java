package com.softwaredesign.schoolsystem.domain.school.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ClassGroupCreateRequest {
    @NotNull(message = "학년은 필수입니다.")
    private int grade;

    @NotNull(message = "학급은 필수입니다.")
    private int classNumber;

    @NotNull(message = "학년도는 필수입니다.")
    private int academicYear;
}
