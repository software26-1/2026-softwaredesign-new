package com.softwaredesign.schoolsystem.domain.approval.service;

import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalCreateRequest;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalResponse;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.approval.repository.ApprovalRequestRepository;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalRequestService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ApprovalResponse create(ApprovalCreateRequest req, Long userId) {
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ApprovalRequest request = ApprovalRequest.create(
                requester, req.getRequestType(), req.getRequestDetail());
        approvalRequestRepository.save(request);
        return ApprovalResponse.from(request);
    }

    public List<ApprovalResponse> getAll(ApprovalStatus statusOrNull, RequestType typeOrNull) {
        List<ApprovalRequest> list;
        if (statusOrNull != null && typeOrNull != null) {
            list = approvalRequestRepository.findByStatusAndRequestType(statusOrNull, typeOrNull);
        } else if (statusOrNull != null) {
            list = approvalRequestRepository.findByStatus(statusOrNull);
        } else if (typeOrNull != null) {
            list = approvalRequestRepository.findByRequestType(typeOrNull);
        } else {
            list = approvalRequestRepository.findAll();
        }
        return list.stream().map(ApprovalResponse::from).toList();
    }

    @Transactional
    public ApprovalResponse process(Long requestId, ApprovalStatus status, Long approverUserId) {
        ApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("승인 요청을 찾을 수 없습니다."));
        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new IllegalArgumentException("승인자를 찾을 수 없습니다."));

        request.process(approver, status);

        notificationService.notify(
                request.getRequester().getId(),
                NotificationEventType.APPROVAL,
                "승인 요청 처리 결과",
                "승인 요청이 " + status.name() + " 처리되었습니다.");

        return ApprovalResponse.from(request);
    }
}
