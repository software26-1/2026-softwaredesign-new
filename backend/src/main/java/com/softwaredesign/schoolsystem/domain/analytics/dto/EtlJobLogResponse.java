package com.softwaredesign.schoolsystem.domain.analytics.dto;

import com.softwaredesign.schoolsystem.domain.analytics.entity.EtlJobLog;

import java.time.LocalDateTime;

public record EtlJobLogResponse(
        Long id,
        String jobName,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String status,
        Integer rowsProcessed,
        String errorMessage
) {
    public static EtlJobLogResponse from(EtlJobLog e) {
        return new EtlJobLogResponse(
                e.getId(),
                e.getJobName(),
                e.getStartedAt(),
                e.getFinishedAt(),
                e.getStatus(),
                e.getRowsProcessed(),
                e.getErrorMessage()
        );
    }
}
