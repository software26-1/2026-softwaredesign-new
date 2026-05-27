package com.softwaredesign.schoolsystem.domain.approval.dto;

import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApprovalCreateRequest {

    @NotNull(message = "요청 유형은 필수입니다.")
    private RequestType requestType;

    @NotBlank(message = "요청 상세 내용은 필수입니다.")
    private String requestDetail;
}
