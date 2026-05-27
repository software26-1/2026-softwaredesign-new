package com.softwaredesign.schoolsystem.domain.notification.sender;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;

/**
 * Push delivery via Firebase Cloud Messaging (FCM).
 *
 * <p>Guarded by {@code app.notification.push.enabled} (default {@code false}).
 * When disabled the sender is a logging no-op and Firebase is NOT initialized,
 * so the app starts with no Firebase credentials.
 *
 * <p>The channel abstraction's {@link #send(String, String, String)} is now a
 * no-op for push: push must be addressed to device tokens, not an email. The
 * {@link NotificationDispatcher} resolves the recipient's registered device
 * tokens (from the {@code device_token} registry) and calls
 * {@link #sendToTokens(List, String, String)}, which performs the real FCM
 * multicast send via {@link FirebaseMessaging}.
 */
@Component
public class PushNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationSender.class);

    @Value("${app.notification.push.enabled}")
    private boolean enabled;

    @Value("${app.notification.push.credentials-path}")
    private String credentialsPath;

    private volatile boolean firebaseReady = false;

    @Override
    public String channel() {
        return "push";
    }

    /**
     * Push cannot be addressed by email — it requires device tokens. The
     * dispatcher resolves tokens and calls {@link #sendToTokens}; this overload
     * is intentionally a no-op so push isn't double-sent through the generic
     * channel fan-out.
     */
    @Override
    public void send(String recipientEmail, String title, String message) {
        // No-op: see sendToTokens(...). Push is token-addressed, not email-addressed.
    }

    /**
     * Sends an FCM push to every supplied device token in a single multicast.
     * Best-effort: never throws. No-op when disabled, unconfigured, or when there
     * are no tokens to target.
     */
    public void sendToTokens(List<String> tokens, String title, String message) {
        if (!enabled) {
            log.info("[push disabled] would notify {} device(s) subject={}",
                    tokens == null ? 0 : tokens.size(), title);
            return;
        }
        if (tokens == null || tokens.isEmpty()) {
            log.info("[push] no device tokens registered — skipping (subject={})", title);
            return;
        }
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("[push] enabled but FIREBASE_CREDENTIALS_PATH is not set — skipping (subject={})", title);
            return;
        }
        try {
            ensureFirebaseInitialized();
            MulticastMessage multicast = MulticastMessage.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(message)
                            .build())
                    .addAllTokens(tokens)
                    .build();
            var response = FirebaseMessaging.getInstance().sendEachForMulticast(multicast);
            log.info("[push] sent subject={} success={} failure={}",
                    title, response.getSuccessCount(), response.getFailureCount());
        } catch (Exception e) {
            // Delivery failure must not break the surrounding transaction.
            log.error("[push] failed for {} device(s) subject={}: {}",
                    tokens.size(), title, e.getMessage());
        }
    }

    /** Lazily initializes the default FirebaseApp once, guarding against double-init. */
    private void ensureFirebaseInitialized() throws Exception {
        if (firebaseReady) {
            return;
        }
        synchronized (this) {
            if (firebaseReady) {
                return;
            }
            if (FirebaseApp.getApps().isEmpty()) {
                try (InputStream credentials = new FileInputStream(credentialsPath)) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(credentials))
                            .build();
                    FirebaseApp.initializeApp(options);
                }
            }
            firebaseReady = true;
        }
    }
}
