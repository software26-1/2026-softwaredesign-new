package com.softwaredesign.schoolsystem.domain.analytics.dto;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;

import java.math.BigDecimal;

public record ScoreTrendPointResponse(
        Integer year,
        Integer semester,
        BigDecimal avgScore,
        BigDecimal weightedScore,
        Integer classRank,
        BigDecimal classAvgScore
) {
    public static ScoreTrendPointResponse from(FactStudentCourseTerm e) {
        return new ScoreTrendPointResponse(
                e.getYear(),
                e.getSemester(),
                e.getAvgScore(),
                e.getWeightedScore(),
                e.getClassRank(),
                e.getClassAvgScore()
        );
    }
}
