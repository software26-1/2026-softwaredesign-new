package com.softwaredesign.schoolsystem.domain.feedback.dto;

import com.softwaredesign.schoolsystem.domain.feedback.entity.Feedback;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class FeedbackResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final Long teacherId;
    private final String teacherName;
    private final FeedbackType type;
    private final String content;
    private final boolean visibleToStudent;
    private final boolean visibleToParent;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static FeedbackResponse from(Feedback feedback) {
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getStudent().getId(),
                feedback.getStudent().getUser().getName(),
                feedback.getTeacher().getId(),
                feedback.getTeacher().getUser().getName(),
                feedback.getType(),
                feedback.getContent(),
                feedback.isVisibleToStudent(),
                feedback.isVisibleToParent(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );
    }
}
