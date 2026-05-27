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
@Table(name = "fact_class_course_stats", schema = "analytics")
public class FactClassCourseStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_group_id")
    private Long classGroupId;

    @Column(name = "course_key")
    private Long courseKey;

    @Column(name = "year")
    private Integer year;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "student_count")
    private Integer studentCount;

    @Column(name = "avg_score")
    private BigDecimal avgScore;

    @Column(name = "max_score")
    private BigDecimal maxScore;

    @Column(name = "min_score")
    private BigDecimal minScore;

    @Column(name = "stddev_score")
    private BigDecimal stddevScore;

    @Column(name = "avg_attendance_rate")
    private BigDecimal avgAttendanceRate;

    @Column(name = "last_refreshed_at")
    private LocalDateTime lastRefreshedAt;
}
