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
@Table(name = "fact_student_learning_summary", schema = "analytics")
public class FactStudentLearningSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_key")
    private Long studentKey;

    @Column(name = "year")
    private Integer year;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "overall_avg_score")
    private BigDecimal overallAvgScore;

    @Column(name = "overall_class_rank")
    private Integer overallClassRank;

    @Column(name = "attendance_rate")
    private BigDecimal attendanceRate;

    @Column(name = "absent_count")
    private Integer absentCount;

    @Column(name = "late_count")
    private Integer lateCount;

    @Column(name = "early_leave_count")
    private Integer earlyLeaveCount;

    @Column(name = "feedback_total")
    private Integer feedbackTotal;

    @Column(name = "positive_feedback")
    private Integer positiveFeedback;

    @Column(name = "negative_feedback")
    private Integer negativeFeedback;

    @Column(name = "counseling_count")
    private Integer counselingCount;

    @Column(name = "score_trend")
    private String scoreTrend;

    @Column(name = "risk_flag")
    private Boolean riskFlag;

    @Column(name = "last_refreshed_at")
    private LocalDateTime lastRefreshedAt;
}
