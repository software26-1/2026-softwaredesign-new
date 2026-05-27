package com.softwaredesign.schoolsystem.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "fact_student_course_term", schema = "analytics")
public class FactStudentCourseTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_key")
    private Long studentKey;

    @Column(name = "course_key")
    private Long courseKey;

    @Column(name = "year")
    private Integer year;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "avg_score")
    private BigDecimal avgScore;

    @Column(name = "midterm_score")
    private BigDecimal midtermScore;

    @Column(name = "final_score")
    private BigDecimal finalScore;

    @Column(name = "task_score")
    private BigDecimal taskScore;

    @Column(name = "weighted_score")
    private BigDecimal weightedScore;

    @Column(name = "class_rank")
    private Integer classRank;

    @Column(name = "class_avg_score")
    private BigDecimal classAvgScore;

    @Column(name = "last_refreshed_at")
    private LocalDateTime lastRefreshedAt;
}
