package com.softwaredesign.schoolsystem.domain.record.dto;

import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class StudentRecordResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final String achievements;
    private final String extracurricular;
    private final int volunteerHours;
    private final String careerAspirations;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static StudentRecordResponse from(StudentRecord record) {
        return new StudentRecordResponse(
                record.getId(),
                record.getStudent().getId(),
                record.getStudent().getUser().getName(),
                record.getAchievements(),
                record.getExtracurricular(),
                record.getVolunteerHours(),
                record.getCareerAspirations(),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }
}
