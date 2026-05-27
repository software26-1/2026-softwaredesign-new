package com.softwaredesign.schoolsystem.domain.counseling.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CounselingUpdateRequest {

    private LocalDateTime counseledAt;

    private String content;

    private String nextPlan;

    private Boolean isShared;
}
