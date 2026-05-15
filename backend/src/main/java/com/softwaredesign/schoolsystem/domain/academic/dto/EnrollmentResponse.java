package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class EnrollmentResponse {
    private final Long id;
    private final Long courseId;
    private final String courseName;
    private final Long studentId;
    private final String studentName;
    private final int studentNumber;
    private final LocalDateTime enrolledAt;

    public static EnrollmentResponse from(Enrollment enrollment) {
        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getCourse().getId(),
                enrollment.getCourse().getCourseName(),
                enrollment.getStudent().getId(),
                enrollment.getStudent().getUser().getName(),
                enrollment.getStudent().getStudentNumber(),
                enrollment.getCreatedAt()
        );
    }
}
