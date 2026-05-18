package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.academic.entity.CourseType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CourseCreateRequest {

    @NotNull(message = "교과 ID는 필수입니다.")
    private Long curriculumId;

    @NotNull(message = "교사 ID는 필수입니다.")
    private Long teacherId;

    @NotNull(message = "학교 ID는 필수입니다.")
    private Long schoolId;

    @NotNull(message = "과목 유형은 필수입니다.")
    private CourseType courseType;

    @NotBlank(message = "과목명은 필수입니다.")
    private String courseName;

    @NotNull(message = "학년도는 필수입니다.")
    private Integer academicYear;

    @NotNull(message = "학기는 필수입니다.")
    @Min(value = 1, message = "학기는 1 또는 2여야 합니다.")
    @Max(value = 2, message = "학기는 1 또는 2여야 합니다.")
    private Integer semester;

    @NotNull(message = "중간고사 비율은 필수입니다.")
    private Integer midtermRatio;

    @NotNull(message = "기말고사 비율은 필수입니다.")
    private Integer finalRatio;

    @NotNull(message = "과제 비율은 필수입니다.")
    private Integer taskRatio;
}
