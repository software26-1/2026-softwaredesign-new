package com.softwaredesign.schoolsystem.domain.notification.sender;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Push delivery via Firebase Cloud Messaging (FCM).
 *
 * <p>Guarded by {@code app.notification.push.enabled} (default {@code false}).
 * When disabled the sender is a logging no-op and Firebase is NOT initialized,
 * so the app starts with no Firebase credentials.
 *
 * <p>TODO: This is effectively a stub. The system does NOT yet store per-user
 * device/registration tokens, so no real FCM message can be addressed. A device
 * token registry (e.g. a {@code device_token} table keyed by user) is required
 * before actual {@code FirebaseMessaging.getInstance().send(...)} calls can be
 * made. For now, when enabled & configured we lazily initialize {@link FirebaseApp}
 * (guarding against double-init) and log that a push would be sent.
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

    @Override
    public void send(String recipientEmail, String title, String message) {
        if (!enabled) {
            log.info("[push disabled] would notify user={} subject={}", recipientEmail, title);
            return;
        }
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("[push] enabled but FIREBASE_CREDENTIALS_PATH is not set — skipping (subject={})", title);
            return;
        }
        try {
            ensureFirebaseInitialized();
            // TODO: no device-token registry yet. Once device tokens are stored per
            // user, resolve the token(s) and call
            // FirebaseMessaging.getInstance().send(Message.builder()...build()).
            log.info("[push] (stub) would send to user={} subject={} — no device token registry yet",
                    recipientEmail, title);
        } catch (Exception e) {
            // Delivery failure must not break the surrounding transaction.
            log.error("[push] failed for user={} subject={}: {}", recipientEmail, title, e.getMessage());
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
