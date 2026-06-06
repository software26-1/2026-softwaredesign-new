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
        // student_id 컬럼은 nullable (V22에서 추가됨) — enrollment 경유로 학생 정보 획득
        Long studentId = grade.getStudent() != null
                ? grade.getStudent().getId()
                : (grade.getEnrollment() != null ? grade.getEnrollment().getStudent().getId() : null);
        String studentName = grade.getStudent() != null
                ? grade.getStudent().getUser().getName()
                : (grade.getEnrollment() != null ? grade.getEnrollment().getStudent().getUser().getName() : null);

        String teacherName = null;
        if (grade.getEnrollment() != null && grade.getEnrollment().getCourse() != null
                && grade.getEnrollment().getCourse().getTeacher() != null) {
            teacherName = grade.getEnrollment().getCourse().getTeacher().getUser().getName();
        }

        return new GradeResponse(
                grade.getId(),
                studentId,
                studentName,
                grade.getEnrollment() != null ? grade.getEnrollment().getId() : null,
                grade.getEnrollment() != null && grade.getEnrollment().getCourse() != null
                        ? grade.getEnrollment().getCourse().getCourseName() : null,
                teacherName,
                grade.getScore(),
                grade.getGradeType(),
                grade.getCreatedAt(),
                grade.getUpdatedAt()
        );
    }
}
