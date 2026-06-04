package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class StudentResponse {
    private final Long id;
    private final Long userId;
    private final String name;
    private final Long schoolId;
    private final String schoolName;
    private final Long classGroupId;
    private final Integer grade;
    private final Integer classNumber;
    private final int studentNumber;
    private final LocalDateTime createdAt;
    private final BigDecimal recentGradeScore;
    private final Long feedbackCount;
    private final Long counselingCount;

    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getUser().getId(),
                student.getUser().getName(),
                student.getSchool() != null ? student.getSchool().getId() : null,
                student.getSchool() != null ? student.getSchool().getSchoolName() : null,
                student.getClassGroup() != null ? student.getClassGroup().getId() : null,
                student.getClassGroup() != null ? student.getClassGroup().getGrade() : null,
                student.getClassGroup() != null ? student.getClassGroup().getClassNumber() : null,
                student.getStudentNumber(),
                student.getCreatedAt(),
                null, null, null
        );
    }

    public static StudentResponse from(Student student, BigDecimal recentGradeScore, long feedbackCount, long counselingCount) {
        return new StudentResponse(
                student.getId(),
                student.getUser().getId(),
                student.getUser().getName(),
                student.getSchool() != null ? student.getSchool().getId() : null,
                student.getSchool() != null ? student.getSchool().getSchoolName() : null,
                student.getClassGroup() != null ? student.getClassGroup().getId() : null,
                student.getClassGroup() != null ? student.getClassGroup().getGrade() : null,
                student.getClassGroup() != null ? student.getClassGroup().getClassNumber() : null,
                student.getStudentNumber(),
                student.getCreatedAt(),
                recentGradeScore,
                feedbackCount,
                counselingCount
        );
    }
}
