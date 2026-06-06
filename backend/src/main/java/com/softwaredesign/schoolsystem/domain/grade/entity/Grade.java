package com.softwaredesign.schoolsystem.domain.grade.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Grade extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "max_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "grade_type", length = 20)
    private GradeType gradeType;

    public static Grade createGrade(Student student, Enrollment enrollment, BigDecimal score, GradeType gradeType) {
        Grade grade = new Grade();
        grade.student = student;
        grade.enrollment = enrollment;
        grade.score = score;
        grade.maxScore = new BigDecimal("100.00");
        grade.gradeType = gradeType;
        return grade;
    }

    public void updateGrade(BigDecimal score, GradeType gradeType) {
        if (score != null) this.score = score;
        if (gradeType != null) this.gradeType = gradeType;
    }
}
