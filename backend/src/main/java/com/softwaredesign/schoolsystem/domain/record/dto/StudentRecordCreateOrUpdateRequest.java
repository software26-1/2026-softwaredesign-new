package com.softwaredesign.schoolsystem.domain.record.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudentRecordCreateOrUpdateRequest {

    private Integer academicYear;

    private Integer semester;

    private String achievements;

    private String extracurricular;

    private Integer volunteerHours;

    private String careerAspirations;
}
