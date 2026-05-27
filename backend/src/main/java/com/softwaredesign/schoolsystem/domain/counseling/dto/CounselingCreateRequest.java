package com.softwaredesign.schoolsystem.domain.counseling.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CounselingCreateRequest {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "상담 일시는 필수입니다.")
    private LocalDateTime counseledAt;

    @NotBlank(message = "상담 내용은 필수입니다.")
    private String content;

    private String nextPlan;

    private Boolean isShared;
}
