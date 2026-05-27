package com.softwaredesign.schoolsystem.domain.approval.dto;

import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class ApprovalResponse {
    private final Long id;
    private final Long requesterId;
    private final String requesterName;
    private final RequestType requestType;
    private final String requestDetail;
    private final ApprovalStatus status;
    private final Long approverId;
    private final LocalDateTime processedAt;
    private final LocalDateTime createdAt;

    public static ApprovalResponse from(ApprovalRequest request) {
        User approver = request.getApprover();
        return new ApprovalResponse(
                request.getId(),
                request.getRequester().getId(),
                request.getRequester().getName(),
                request.getRequestType(),
                request.getRequestDetail(),
                request.getStatus(),
                approver != null ? approver.getId() : null,
                request.getProcessedAt(),
                request.getCreatedAt()
        );
    }
}
