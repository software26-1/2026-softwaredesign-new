package com.softwaredesign.schoolsystem.domain.feedback.dto;

import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FeedbackCreateRequest {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "피드백 유형은 필수입니다.")
    private FeedbackType type;

    @NotBlank(message = "피드백 내용은 필수입니다.")
    private String content;

    private Boolean visibleToStudent;

    private Boolean visibleToParent;
}
