package com.softwaredesign.schoolsystem.domain.grade.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GradeSummary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_group_id", nullable = false)
    private ClassGroup classGroup;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "semester", nullable = false)
    private int semester;

    @Column(name = "average_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal averageScore;

    @Column(name = "rank")
    private Integer rank;

    public static GradeSummary createGradeSummary(Student student, ClassGroup classGroup,
                                                   int year, int semester,
                                                   BigDecimal averageScore, Integer rank) {
        GradeSummary gs = new GradeSummary();
        gs.student = student;
        gs.classGroup = classGroup;
        gs.year = year;
        gs.semester = semester;
        gs.averageScore = averageScore;
        gs.rank = rank;
        return gs;
    }

    public void update(BigDecimal averageScore, Integer rank) {
        if (averageScore != null) this.averageScore = averageScore;
        if (rank != null) this.rank = rank;
    }
}
