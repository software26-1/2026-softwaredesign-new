package com.softwaredesign.schoolsystem.domain.student.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudentUpdateRequest {
    private Long classGroupId;
    private Integer studentNumber;
}
