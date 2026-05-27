package com.softwaredesign.schoolsystem.domain.analytics.event;

import com.softwaredesign.schoolsystem.domain.analytics.service.AnalyticsIncrementalService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Bridges in-process Spring ApplicationEvents (always published by the
 * operational services) to incremental analytics updates.
 *
 * <p>If {@code app.kafka.enabled=true} the affected studentId is sent to a Kafka
 * topic and {@link AnalyticsKafkaConsumer} performs the incremental update;
 * otherwise the update is performed directly in-process. Either way analytics
 * stays incrementally fresh — Kafka is just the optional transport.
 *
 * <p>The {@link KafkaTemplate} is injected via {@link ObjectProvider} so the
 * bean is NOT required when Kafka is disabled. With {@code app.kafka.enabled=false}
 * this class never touches Kafka and the app starts with no broker.
 */
@Component
@RequiredArgsConstructor
public class AnalyticsEventBridge {

    static final String TOPIC_GRADE_CHANGED = "grade.changed";
    static final String TOPIC_ATTENDANCE_CHANGED = "attendance.changed";
    static final String TOPIC_FEEDBACK_CHANGED = "feedback.changed";

    @Value("${app.kafka.enabled}")
    private boolean kafkaEnabled;

    private final ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplateProvider;
    private final AnalyticsIncrementalService incrementalService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGradeChanged(GradeChangedEvent event) {
        dispatch(TOPIC_GRADE_CHANGED, event.studentId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAttendanceChanged(AttendanceChangedEvent event) {
        dispatch(TOPIC_ATTENDANCE_CHANGED, event.studentId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFeedbackChanged(FeedbackChangedEvent event) {
        dispatch(TOPIC_FEEDBACK_CHANGED, event.studentId());
    }

    private void dispatch(String topic, Long studentId) {
        if (studentId == null) {
            return;
        }
        if (kafkaEnabled) {
            KafkaTemplate<String, Object> template = kafkaTemplateProvider.getIfAvailable();
            if (template != null) {
                template.send(topic, String.valueOf(studentId), studentId);
                return;
            }
            // Kafka enabled but no template available — fall back to in-process.
        }
        incrementalService.refreshStudent(studentId);
    }
}
