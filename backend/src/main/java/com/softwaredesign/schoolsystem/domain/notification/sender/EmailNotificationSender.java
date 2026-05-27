package com.softwaredesign.schoolsystem.domain.notification.sender;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

/**
 * Email delivery via AWS SES v2.
 *
 * <p>Guarded by {@code app.notification.email.enabled} (default {@code false}).
 * When disabled the sender is a logging no-op and NO AWS client is constructed,
 * so the app starts with no AWS credentials. When enabled the {@link SesV2Client}
 * is built lazily on first use and cached. All SDK calls are wrapped so delivery
 * failures are logged and swallowed (never thrown).
 */
@Component
public class EmailNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationSender.class);

    @Value("${app.notification.email.enabled}")
    private boolean enabled;

    @Value("${app.notification.email.from}")
    private String fromAddress;

    @Value("${app.notification.email.region}")
    private String region;

    /** Lazily initialized & cached. {@code volatile} for safe double-checked init. */
    private volatile SesV2Client sesClient;

    @Override
    public String channel() {
        return "email";
    }

    @Override
    public void send(String recipientEmail, String title, String message) {
        if (!enabled) {
            log.info("[email disabled] would send to={} subject={}", recipientEmail, title);
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("[email] skipped — recipient email is missing (subject={})", title);
            return;
        }
        try {
            SesV2Client client = client();
            SendEmailRequest request = SendEmailRequest.builder()
                    .fromEmailAddress(fromAddress)
                    .destination(Destination.builder().toAddresses(recipientEmail).build())
                    .content(EmailContent.builder()
                            .simple(Message.builder()
                                    .subject(Content.builder().data(title).build())
                                    .body(Body.builder()
                                            .text(Content.builder().data(message).build())
                                            .build())
                                    .build())
                            .build())
                    .build();
            client.sendEmail(request);
            log.info("[email] sent to={} subject={}", recipientEmail, title);
        } catch (Exception e) {
            // Delivery failure must not break the surrounding transaction.
            log.error("[email] failed to send to={} subject={}: {}", recipientEmail, title, e.getMessage());
        }
    }

    /** Builds the SES client on first use (double-checked locking) and caches it. */
    private SesV2Client client() {
        SesV2Client local = sesClient;
        if (local == null) {
            synchronized (this) {
                local = sesClient;
                if (local == null) {
                    local = SesV2Client.builder()
                            .region(Region.of(region))
                            .build();
                    sesClient = local;
                }
            }
        }
        return local;
    }
}
