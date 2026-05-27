package com.softwaredesign.schoolsystem.domain.feedback.dto;

import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FeedbackUpdateRequest {

    private FeedbackType type;

    private String content;

    private Boolean visibleToStudent;

    private Boolean visibleToParent;
}
