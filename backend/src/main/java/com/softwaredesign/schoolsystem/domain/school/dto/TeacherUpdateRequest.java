package com.softwaredesign.schoolsystem.domain.school.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TeacherUpdateRequest {
    private Long schoolId;
    private String position;
}
