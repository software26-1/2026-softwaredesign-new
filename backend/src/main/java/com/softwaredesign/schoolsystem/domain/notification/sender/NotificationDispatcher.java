package com.softwaredesign.schoolsystem.domain.notification.sender;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fans an in-app notification out to every external delivery channel.
 *
 * <p>All {@link NotificationSender}s are injected as a list; each is invoked in
 * its own try/catch so one channel's failure can't affect another channel or the
 * caller's transaction. Senders are themselves best-effort, this is a second
 * guard.
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationSender> senders;

    public void dispatch(User recipient, String title, String message) {
        if (recipient == null) {
            log.warn("[dispatch] skipped — recipient is null (subject={})", title);
            return;
        }
        String email = recipient.getEmail();
        for (NotificationSender sender : senders) {
            try {
                sender.send(email, title, message);
            } catch (Exception e) {
                log.error("[dispatch] channel={} failed for user={}: {}",
                        sender.channel(), email, e.getMessage());
            }
        }
    }
}
