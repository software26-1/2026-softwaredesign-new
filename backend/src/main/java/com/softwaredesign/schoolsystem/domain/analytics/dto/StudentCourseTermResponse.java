package com.softwaredesign.schoolsystem.domain.analytics.dto;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StudentCourseTermResponse(
        Long studentKey,
        Long courseKey,
        Integer year,
        Integer semester,
        BigDecimal avgScore,
        BigDecimal midtermScore,
        BigDecimal finalScore,
        BigDecimal taskScore,
        BigDecimal weightedScore,
        Integer classRank,
        BigDecimal classAvgScore,
        LocalDateTime lastRefreshedAt
) {
    public static StudentCourseTermResponse from(FactStudentCourseTerm e) {
        return new StudentCourseTermResponse(
                e.getStudentKey(),
                e.getCourseKey(),
                e.getYear(),
                e.getSemester(),
                e.getAvgScore(),
                e.getMidtermScore(),
                e.getFinalScore(),
                e.getTaskScore(),
                e.getWeightedScore(),
                e.getClassRank(),
                e.getClassAvgScore(),
                e.getLastRefreshedAt()
        );
    }
}
