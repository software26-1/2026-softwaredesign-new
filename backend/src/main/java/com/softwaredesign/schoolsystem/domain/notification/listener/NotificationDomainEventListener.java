package com.softwaredesign.schoolsystem.domain.notification.listener;

import com.softwaredesign.schoolsystem.domain.analytics.event.AttendanceChangedEvent;
import com.softwaredesign.schoolsystem.domain.analytics.event.FeedbackChangedEvent;
import com.softwaredesign.schoolsystem.domain.analytics.event.GradeChangedEvent;
import com.softwaredesign.schoolsystem.domain.analytics.event.StudentRecordChangedEvent;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.event.ProfileSetupEvent;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.repository.AdminRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
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
    private static final String ATTENDANCE_TITLE = "출결 정보가 업데이트되었습니다";
    private static final String ATTENDANCE_MESSAGE = "출결 정보가 변경되었습니다. 확인해 주세요.";
    private static final String RECORD_TITLE = "생활기록부가 업데이트되었습니다";
    private static final String RECORD_MESSAGE = "학생부 기록이 변경되었습니다. 확인해 주세요.";

    private final NotificationService notificationService;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final AdminRepository adminRepository;
    private final SchoolRepository schoolRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProfileSetup(ProfileSetupEvent event) {
        if (event.schoolName() == null) return;
        try {
            schoolRepository.findBySchoolName(event.schoolName()).ifPresent(school -> {
                List<Admin> admins = adminRepository.findAllBySchoolIdAndIsDeletedFalse(school.getId());
                for (Admin admin : admins) {
                    if (admin.getUser() != null) {
                        notificationService.notify(
                                admin.getUser().getId(),
                                NotificationEventType.APPROVAL,
                                "교사 가입 승인 요청",
                                event.userName() + " 선생님이 가입 신청을 완료했습니다. 승인이 필요합니다.");
                    }
                }
            });
        } catch (Exception e) {
            log.error("[notify-event] profile setup notification failed: {}", e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGradeChanged(GradeChangedEvent event) {
        notifyStudentAndParents(event.studentId(), NotificationEventType.GRADE_UPDATE,
                GRADE_TITLE, GRADE_MESSAGE, true, true);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAttendanceChanged(AttendanceChangedEvent event) {
        notifyStudentAndParents(event.studentId(), NotificationEventType.ATTENDANCE,
                ATTENDANCE_TITLE, ATTENDANCE_MESSAGE, true, true);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStudentRecordChanged(StudentRecordChangedEvent event) {
        notifyStudentAndParents(event.studentId(), NotificationEventType.RECORD,
                RECORD_TITLE, RECORD_MESSAGE, true, true);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFeedbackChanged(FeedbackChangedEvent event) {
        // 공개 설정에 따라 대상이 정해진다. 둘 다 비공개(수정/삭제 포함)면 알림 없음.
        if (!event.notifyStudent() && !event.notifyParent()) {
            return;
        }
        notifyStudentAndParents(event.studentId(), NotificationEventType.FEEDBACK,
                FEEDBACK_TITLE, FEEDBACK_MESSAGE, event.notifyStudent(), event.notifyParent());
    }

    private void notifyStudentAndParents(Long studentId, NotificationEventType eventType,
                                         String title, String message,
                                         boolean toStudent, boolean toParent) {
        if (studentId == null) {
            return;
        }
        try {
            Student student = studentRepository.findById(studentId).orElse(null);
            if (student == null || student.getUser() == null) {
                log.warn("[notify-event] student or user not found for studentId={}", studentId);
                return;
            }

            // Notify the student only when visible to student.
            if (toStudent) {
                notificationService.notify(student.getUser().getId(), eventType, title, message);
            }

            // Notify each linked parent only when visible to parent.
            if (toParent) {
                List<ParentStudent> links = parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(studentId);
                for (ParentStudent link : links) {
                    if (link.getParent() != null && link.getParent().getUser() != null) {
                        notificationService.notify(link.getParent().getUser().getId(),
                                eventType, title, message);
                    }
                }
            }
        } catch (Exception e) {
            log.error("[notify-event] failed for studentId={} type={}: {}",
                    studentId, eventType, e.getMessage());
        }
    }
}
