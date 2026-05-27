package com.softwaredesign.schoolsystem.domain.analytics.event;

/**
 * Published after an attendance record is created/updated/deleted. Carries only
 * the affected student's id; the incremental analytics job recomputes that
 * student's facts from the source tables.
 */
public record AttendanceChangedEvent(Long studentId) {
}
