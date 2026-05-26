package com.softwaredesign.schoolsystem.domain.attendance.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AttendanceSummaryResponse {
    private final Long studentId;
    private final String studentName;
    private final long present;
    private final long absent;
    private final long late;
    private final long earlyLeave;
    private final long total;
}
