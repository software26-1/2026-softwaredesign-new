package com.softwaredesign.schoolsystem.domain.feedback.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.analytics.event.FeedbackChangedEvent;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackCreateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackUpdateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.entity.Feedback;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final TeacherRepository teacherRepository;
    private final ClassGroupRepository classGroupRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public FeedbackResponse createFeedback(FeedbackCreateRequest request, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        if (FeedbackType.ACADEMIC.equals(request.getType())) {
            validateGradeFeedbackPermission(teacher, student);
        }

        boolean visibleToStudent = request.getVisibleToStudent() == null || request.getVisibleToStudent();
        boolean visibleToParent = request.getVisibleToParent() == null || request.getVisibleToParent();

        Feedback feedback = Feedback.createFeedback(
                teacher, student, request.getContent(), request.getType(), visibleToStudent, visibleToParent);
        feedbackRepository.save(feedback);
        // 공개 설정에 맞춰 학생/학부모에게만 알림 발송
        eventPublisher.publishEvent(new FeedbackChangedEvent(student.getId(), visibleToStudent, visibleToParent));
        return FeedbackResponse.from(feedback);
    }

    public List<FeedbackResponse> getByStudent(Long studentId, FeedbackType type, AuthUser authUser) {
        List<Feedback> feedbacks = (type != null)
                ? feedbackRepository.findByStudentIdAndType(studentId, type)
                : feedbackRepository.findByStudentId(studentId);

        String role = authUser.role();
        if ("TEACHER".equals(role) || "ADMIN".equals(role)) {
            return feedbacks.stream().map(FeedbackResponse::from).toList();
        }
        if ("STUDENT".equals(role)) {
            return feedbacks.stream()
                    .filter(f -> f.getStudent().getUser().getId().equals(authUser.id()))
                    .filter(Feedback::isVisibleToStudent)
                    .map(FeedbackResponse::from)
                    .toList();
        }
        if ("PARENT".equals(role)) {
            boolean isMyChild = parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(studentId).stream()
                    .anyMatch(ps -> isParentUser(ps, authUser.id()));
            if (!isMyChild) {
                return List.of();
            }
            return feedbacks.stream()
                    .filter(Feedback::isVisibleToParent)
                    .map(FeedbackResponse::from)
                    .toList();
        }
        return List.of();
    }

    @Transactional
    public FeedbackResponse updateFeedback(Long feedbackId, FeedbackUpdateRequest request, Long userId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("피드백을 찾을 수 없습니다."));
        validateOwner(feedback, userId);
        feedback.updateFeedback(request.getContent(), request.getType(),
                request.getVisibleToStudent(), request.getVisibleToParent());
        eventPublisher.publishEvent(new FeedbackChangedEvent(feedback.getStudent().getId()));
        return FeedbackResponse.from(feedback);
    }

    @Transactional
    public void deleteFeedback(Long feedbackId, Long userId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("피드백을 찾을 수 없습니다."));
        validateOwner(feedback, userId);
        Long studentId = feedback.getStudent().getId();
        feedbackRepository.delete(feedback);
        eventPublisher.publishEvent(new FeedbackChangedEvent(studentId));
    }

    private void validateOwner(Feedback feedback, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new AccessDeniedException("교사를 찾을 수 없습니다."));
        boolean isAuthor = feedback.getTeacher().getUser().getId().equals(userId);
        boolean isHomeroom = isHomeroomOfStudent(teacher, feedback.getStudent());
        if (!isAuthor && !isHomeroom) {
            throw new AccessDeniedException("작성자 또는 담임 교사만 피드백을 수정/삭제할 수 있습니다.");
        }
    }

    private void validateGradeFeedbackPermission(Teacher teacher, Student student) {
        boolean isSubject = teacher.getPosition() != null &&
                (teacher.getPosition().equals("SUBJECT") || teacher.getPosition().equals("HOMEROOM_SUBJECT"));
        boolean isHomeroom = isHomeroomOfStudent(teacher, student);
        if (!isSubject && !isHomeroom) {
            throw new AccessDeniedException("성적 피드백은 교과 담당 또는 담임 교사만 작성할 수 있습니다.");
        }
    }

    private boolean isHomeroomOfStudent(Teacher teacher, Student student) {
        return classGroupRepository.findByHomeroomTeacherIdAndIsDeletedFalse(teacher.getId())
                .map(cg -> student.getClassGroup() != null && student.getClassGroup().getId().equals(cg.getId()))
                .orElse(false);
    }

    private boolean isParentUser(ParentStudent parentStudent, Long userId) {
        return parentStudent.getParent() != null
                && parentStudent.getParent().getUser() != null
                && parentStudent.getParent().getUser().getId().equals(userId);
    }
}
