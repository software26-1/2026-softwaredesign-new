package com.softwaredesign.schoolsystem.domain.analytics.event;

/**
 * Published after a feedback record is created/updated/deleted. Carries only the
 * affected student's id; the incremental analytics job recomputes that student's
 * facts from the source tables.
 */
public record FeedbackChangedEvent(Long studentId) {
}
