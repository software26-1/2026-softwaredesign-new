package com.softwaredesign.schoolsystem.domain.analytics.event;

/**
 * Published after a feedback record is created/updated/deleted. Carries the
 * affected student's id (for the incremental analytics job) plus notification
 * intent: {@code notifyStudent}/{@code notifyParent} mirror the feedback's
 * visibility flags so in-app notifications only fire to the audiences the
 * teacher actually made the feedback visible to.
 *
 * <p>Update/delete use the single-arg constructor (notify flags false) so they
 * refresh analytics without emitting a "new feedback" notification.
 */
public record FeedbackChangedEvent(Long studentId, boolean notifyStudent, boolean notifyParent) {

    /** Analytics-only (no notification) — used for update/delete. */
    public FeedbackChangedEvent(Long studentId) {
        this(studentId, false, false);
    }
}
