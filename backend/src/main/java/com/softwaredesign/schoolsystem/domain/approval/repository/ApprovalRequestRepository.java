package com.softwaredesign.schoolsystem.domain.approval.repository;

import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    List<ApprovalRequest> findByStatus(ApprovalStatus status);
    List<ApprovalRequest> findByRequestType(RequestType requestType);
    List<ApprovalRequest> findByStatusAndRequestType(ApprovalStatus status, RequestType requestType);
    List<ApprovalRequest> findByRequesterId(Long requesterId);
}
