package com.softwaredesign.schoolsystem.domain.grade.dto;

import com.softwaredesign.schoolsystem.domain.grade.entity.GradeType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class GradeCreateRequest {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "수강 ID는 필수입니다.")
    private Long enrollmentId;

    @NotNull(message = "점수는 필수입니다.")
    @DecimalMin(value = "0.0", message = "점수는 0 이상이어야 합니다.")
    @DecimalMax(value = "100.0", message = "점수는 100 이하이어야 합니다.")
    private BigDecimal score;

    @NotNull(message = "성적 유형은 필수입니다.")
    private GradeType gradeType;
}
