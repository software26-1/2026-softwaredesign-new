package com.softwaredesign.schoolsystem.domain.school.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ClassGroupUpdateRequest {
    private Integer grade; // null일 시 변경 안함.
    private Integer classNumber;
}
