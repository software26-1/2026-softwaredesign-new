package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.softwaredesign.schoolsystem.domain.academic.entity.CourseType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CourseUpdateRequest {

    private String courseName;

    private CourseType courseType;

    private Integer midtermRatio;

    private Integer finalRatio;

    private Integer taskRatio;
}
