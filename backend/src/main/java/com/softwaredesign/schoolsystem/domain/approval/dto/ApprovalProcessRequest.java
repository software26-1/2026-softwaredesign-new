package com.softwaredesign.schoolsystem.domain.approval.dto;

import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApprovalProcessRequest {

    @NotNull(message = "처리 상태는 필수입니다.")
    private ApprovalStatus status;
}
