package com.softwaredesign.schoolsystem.domain.analytics.dto;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactClassCourseStats;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClassCourseStatsResponse(
        Long classGroupId,
        Long courseKey,
        Integer year,
        Integer semester,
        Integer studentCount,
        BigDecimal avgScore,
        BigDecimal maxScore,
        BigDecimal minScore,
        BigDecimal stddevScore,
        BigDecimal avgAttendanceRate,
        LocalDateTime lastRefreshedAt
) {
    public static ClassCourseStatsResponse from(FactClassCourseStats e) {
        return new ClassCourseStatsResponse(
                e.getClassGroupId(),
                e.getCourseKey(),
                e.getYear(),
                e.getSemester(),
                e.getStudentCount(),
                e.getAvgScore(),
                e.getMaxScore(),
                e.getMinScore(),
                e.getStddevScore(),
                e.getAvgAttendanceRate(),
                e.getLastRefreshedAt()
        );
    }
}
