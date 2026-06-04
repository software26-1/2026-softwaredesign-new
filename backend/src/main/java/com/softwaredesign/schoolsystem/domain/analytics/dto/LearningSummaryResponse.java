package com.softwaredesign.schoolsystem.domain.analytics.dto;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentLearningSummary;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LearningSummaryResponse(
        Long studentKey,
        Integer year,
        Integer semester,
        BigDecimal overallAvgScore,
        Integer overallClassRank,
        Integer overallYearRank,
        BigDecimal attendanceRate,
        Integer absentCount,
        Integer lateCount,
        Integer earlyLeaveCount,
        Integer feedbackTotal,
        Integer positiveFeedback,
        Integer negativeFeedback,
        Integer counselingCount,
        String scoreTrend,
        Boolean riskFlag,
        LocalDateTime lastRefreshedAt
) {
    public static LearningSummaryResponse from(FactStudentLearningSummary e) {
        return new LearningSummaryResponse(
                e.getStudentKey(),
                e.getYear(),
                e.getSemester(),
                e.getOverallAvgScore(),
                e.getOverallClassRank(),
                null,
                e.getAttendanceRate(),
                e.getAbsentCount(),
                e.getLateCount(),
                e.getEarlyLeaveCount(),
                e.getFeedbackTotal(),
                e.getPositiveFeedback(),
                e.getNegativeFeedback(),
                e.getCounselingCount(),
                e.getScoreTrend(),
                e.getRiskFlag(),
                e.getLastRefreshedAt()
        );
    }

    public static LearningSummaryResponse withYearRank(LearningSummaryResponse r, Integer yearRank) {
        return new LearningSummaryResponse(
                r.studentKey(), r.year(), r.semester(),
                r.overallAvgScore(), r.overallClassRank(), yearRank,
                r.attendanceRate(), r.absentCount(), r.lateCount(), r.earlyLeaveCount(),
                r.feedbackTotal(), r.positiveFeedback(), r.negativeFeedback(),
                r.counselingCount(), r.scoreTrend(), r.riskFlag(), r.lastRefreshedAt()
        );
    }
}
