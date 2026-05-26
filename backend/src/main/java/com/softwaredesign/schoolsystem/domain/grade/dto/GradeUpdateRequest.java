package com.softwaredesign.schoolsystem.domain.grade.dto;

import com.softwaredesign.schoolsystem.domain.grade.entity.GradeType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class GradeUpdateRequest {
    private BigDecimal score;
    private GradeType gradeType;
}
