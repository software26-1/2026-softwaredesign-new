package com.softwaredesign.schoolsystem.domain.record.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudentRecordCreateOrUpdateRequest {

    private String achievements;

    private String extracurricular;

    private Integer volunteerHours;

    private String careerAspirations;
}
