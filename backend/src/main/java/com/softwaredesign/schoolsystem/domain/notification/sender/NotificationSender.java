package com.softwaredesign.schoolsystem.domain.notification.sender;

/**
 * Abstraction for an external notification delivery channel (email, push, ...).
 *
 * <p>Implementations MUST be best-effort: a delivery failure must never throw
 * out of {@link #send}. Persistence of the in-app {@code Notification} is the
 * source of truth; external delivery is a side channel.
 */
public interface NotificationSender {

    /**
     * Delivers a notification through this channel. Implementations must never
     * throw — failures are logged and swallowed.
     */
    void send(String recipientEmail, String title, String message);

    /** Stable channel identifier for logging (e.g. {@code "email"}, {@code "push"}). */
    String channel();
}
