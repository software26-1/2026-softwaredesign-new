package com.softwaredesign.schoolsystem.domain.notification.listener;

import com.softwaredesign.schoolsystem.domain.analytics.event.FeedbackChangedEvent;
import com.softwaredesign.schoolsystem.domain.analytics.event.GradeChangedEvent;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Turns analytics domain events into in-app notifications (which in turn fan out
 * to external channels via the {@link NotificationService} → dispatcher chain).
 *
 * <p>Listens AFTER_COMMIT so notifications only fire once the source change is
 * durable. {@link com.softwaredesign.schoolsystem.domain.analytics.event.AnalyticsEventBridge}
 * also listens to these same events for analytics — multiple
 * {@code @TransactionalEventListener} beans per event is fine; both run.
 *
 * <p>All handling is wrapped in try/catch and never throws: a notification
 * failure must not affect the committed business transaction.
 */
@Component
@RequiredArgsConstructor
public class NotificationDomainEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationDomainEventListener.class);

    private static final String GRADE_TITLE = "성적이 업데이트되었습니다";
    private static final String GRADE_MESSAGE = "성적 정보가 변경되었습니다. 확인해 주세요.";
    private static final String FEEDBACK_TITLE = "새로운 피드백이 등록되었습니다";
    private static final String FEEDBACK_MESSAGE = "선생님이 새로운 피드백을 남겼습니다. 확인해 주세요.";

    private final NotificationService notificationService;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGradeChanged(GradeChangedEvent event) {
        notifyStudentAndParents(event.studentId(), NotificationEventType.GRADE_UPDATE,
                GRADE_TITLE, GRADE_MESSAGE);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFeedbackChanged(FeedbackChangedEvent event) {
        notifyStudentAndParents(event.studentId(), NotificationEventType.FEEDBACK,
                FEEDBACK_TITLE, FEEDBACK_MESSAGE);
    }

    private void notifyStudentAndParents(Long studentId, NotificationEventType eventType,
                                         String title, String message) {
        if (studentId == null) {
            return;
        }
        try {
            Student student = studentRepository.findById(studentId).orElse(null);
            if (student == null || student.getUser() == null) {
                log.warn("[notify-event] student or user not found for studentId={}", studentId);
                return;
            }

            // Notify the student.
            notificationService.notify(student.getUser().getId(), eventType, title, message);

            // Notify each linked parent.
            List<ParentStudent> links = parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(studentId);
            for (ParentStudent link : links) {
                if (link.getParent() != null && link.getParent().getUser() != null) {
                    notificationService.notify(link.getParent().getUser().getId(),
                            eventType, title, message);
                }
            }
        } catch (Exception e) {
            log.error("[notify-event] failed for studentId={} type={}: {}",
                    studentId, eventType, e.getMessage());
        }
    }
}
