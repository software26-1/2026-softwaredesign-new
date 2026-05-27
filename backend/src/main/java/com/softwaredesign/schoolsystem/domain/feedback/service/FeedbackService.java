package com.softwaredesign.schoolsystem.domain.feedback.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackCreateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackUpdateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.entity.Feedback;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
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
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    @Transactional
    public FeedbackResponse createFeedback(FeedbackCreateRequest request, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        boolean visibleToStudent = request.getVisibleToStudent() == null || request.getVisibleToStudent();
        boolean visibleToParent = request.getVisibleToParent() == null || request.getVisibleToParent();

        Feedback feedback = Feedback.createFeedback(
                teacher, student, request.getContent(), request.getType(), visibleToStudent, visibleToParent);
        feedbackRepository.save(feedback);
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
        return FeedbackResponse.from(feedback);
    }

    @Transactional
    public void deleteFeedback(Long feedbackId, Long userId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("피드백을 찾을 수 없습니다."));
        validateOwner(feedback, userId);
        feedbackRepository.delete(feedback);
    }

    private void validateOwner(Feedback feedback, Long userId) {
        if (!feedback.getTeacher().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 피드백을 작성한 교사만 관리할 수 있습니다.");
        }
    }

    private boolean isParentUser(ParentStudent parentStudent, Long userId) {
        return parentStudent.getParent() != null
                && parentStudent.getParent().getUser() != null
                && parentStudent.getParent().getUser().getId().equals(userId);
    }
}
