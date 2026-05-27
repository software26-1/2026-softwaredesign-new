package com.softwaredesign.schoolsystem.domain.notification.sender;

import com.softwaredesign.schoolsystem.domain.notification.service.DeviceTokenService;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fans an in-app notification out to every external delivery channel.
 *
 * <p>Email-addressable senders are injected as a list; each is invoked in its
 * own try/catch so one channel's failure can't affect another channel or the
 * caller's transaction. Push is token-addressed: the dispatcher resolves the
 * recipient's registered device tokens and hands them to
 * {@link PushNotificationSender#sendToTokens(List, String, String)}. Senders are
 * themselves best-effort; this is a second guard.
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationSender> senders;
    private final PushNotificationSender pushNotificationSender;
    private final DeviceTokenService deviceTokenService;

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
        dispatchPush(recipient, title, message);
    }

    /** Resolves the recipient's device tokens and performs the real FCM multicast. */
    private void dispatchPush(User recipient, String title, String message) {
        try {
            List<String> tokens = deviceTokenService.tokensForUser(recipient.getId());
            pushNotificationSender.sendToTokens(tokens, title, message);
        } catch (Exception e) {
            log.error("[dispatch] push failed for user={}: {}", recipient.getEmail(), e.getMessage());
        }
    }
}
