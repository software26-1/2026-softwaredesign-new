package com.softwaredesign.schoolsystem.domain.student.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ParentStudentCreateRequest {
    @NotNull(message = "학부모 ID는 필수입니다.")
    private Long parentId;

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    private String relationship;
}
