package com.softwaredesign.schoolsystem.domain.grade.dto;

import com.softwaredesign.schoolsystem.domain.grade.entity.Grade;
import com.softwaredesign.schoolsystem.domain.grade.entity.GradeType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class GradeResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final Long enrollmentId;
    private final String courseName;
    private final String teacherName;
    private final BigDecimal score;
    private final GradeType gradeType;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static GradeResponse from(Grade grade) {
        return new GradeResponse(
                grade.getId(),
                grade.getStudent().getId(),
                grade.getStudent().getUser().getName(),
                grade.getEnrollment().getId(),
                grade.getEnrollment().getCourse().getCourseName(),
                grade.getEnrollment().getCourse().getTeacher().getUser().getName(),
                grade.getScore(),
                grade.getGradeType(),
                grade.getCreatedAt(),
                grade.getUpdatedAt()
        );
    }
}
