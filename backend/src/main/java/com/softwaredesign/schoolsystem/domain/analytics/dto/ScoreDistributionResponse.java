package com.softwaredesign.schoolsystem.domain.analytics.dto;

public record ScoreDistributionResponse(
        String bucket,
        long count
) {
}
