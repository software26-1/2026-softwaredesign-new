package com.softwaredesign.schoolsystem.domain.feedback.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
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
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
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
    private final EnrollmentRepository enrollmentRepository;
    private final StudentAccessGuard studentAccessGuard;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public FeedbackResponse createFeedback(FeedbackCreateRequest request, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 학교 격리: 같은 학교 학생에게만 작성 가능 (행동/출결/태도 포함 모든 유형)
        requireSameSchool(teacher, student);
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
        if ("ADMIN".equals(role)) {
            return feedbacks.stream().map(FeedbackResponse::from).toList();
        }
        if ("TEACHER".equals(role)) {
            // 학교 격리: 타 학교 학생 피드백 조회 차단
            studentAccessGuard.requireCanAccessStudent(authUser, studentId);
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
        // 담임이거나 해당 학생을 실제로 가르치는(수강) 교과 교사만 성적 피드백 작성 가능.
        // (학생부 권한과 동일 기준 — position 문자열만 보면 안 가르치는 학생에게도 작성되는 구멍이 있었음)
        boolean isHomeroom = isHomeroomOfStudent(teacher, student);
        boolean isSubjectTeacher = enrollmentRepository
                .existsByStudentIdAndCourse_Teacher_IdAndIsDeletedFalse(student.getId(), teacher.getId());
        if (!isHomeroom && !isSubjectTeacher) {
            throw new AccessDeniedException("성적 피드백은 담임 또는 해당 학생을 가르치는 교과 교사만 작성할 수 있습니다.");
        }
    }

    private void requireSameSchool(Teacher teacher, Student student) {
        Long teacherSchoolId = teacher.getSchool() != null ? teacher.getSchool().getId() : null;
        Long studentSchoolId = student.getSchool() != null ? student.getSchool().getId() : null;
        if (teacherSchoolId == null || studentSchoolId == null || !teacherSchoolId.equals(studentSchoolId)) {
            throw new AccessDeniedException("같은 학교 학생에게만 피드백을 작성할 수 있습니다.");
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
