package com.softwaredesign.schoolsystem.domain.student.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudentCreateRequest {
    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;

    @NotNull(message = "학교 ID는 필수입니다.")
    private Long schoolId;

    @NotNull(message = "학급 ID는 필수입니다.")
    private Long classGroupId;

    @NotNull(message = "학번은 필수입니다.")
    private Integer studentNumber;
}
