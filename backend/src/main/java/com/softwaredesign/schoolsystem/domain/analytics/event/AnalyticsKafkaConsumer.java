package com.softwaredesign.schoolsystem.domain.analytics.event;

import com.softwaredesign.schoolsystem.domain.analytics.service.AnalyticsIncrementalService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes studentId messages from the analytics change topics and performs the
 * incremental update. Only registered when {@code app.kafka.enabled=true}, so
 * when Kafka is disabled there is no active {@code @KafkaListener} and the
 * application never attempts to connect to a broker at startup.
 */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
@RequiredArgsConstructor
public class AnalyticsKafkaConsumer {

    private final AnalyticsIncrementalService incrementalService;

    @KafkaListener(
            topics = {"grade.changed", "attendance.changed", "feedback.changed"},
            groupId = "analytics-consumer")
    public void onStudentChanged(Long studentId) {
        if (studentId != null) {
            incrementalService.refreshStudent(studentId);
        }
    }
}
