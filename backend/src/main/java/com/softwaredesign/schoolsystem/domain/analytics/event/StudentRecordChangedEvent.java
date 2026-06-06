package com.softwaredesign.schoolsystem.domain.analytics.event;

/**
 * Published after a student record (생활기록부) is created/updated/deleted.
 * Carries only the affected student's id so listeners can notify the student/parents.
 */
public record StudentRecordChangedEvent(Long studentId) {
}
