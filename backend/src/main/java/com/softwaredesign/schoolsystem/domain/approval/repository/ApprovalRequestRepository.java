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
    List<ApprovalRequest> findByFromSchoolIdOrToSchoolId(Long fromSchoolId, Long toSchoolId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT a FROM ApprovalRequest a WHERE (a.fromSchool.id = :schoolId OR a.toSchool.id = :schoolId) AND a.status = :status"
    )
    List<ApprovalRequest> findBySchoolAndStatus(
        @org.springframework.data.repository.query.Param("schoolId") Long schoolId,
        @org.springframework.data.repository.query.Param("status") ApprovalStatus status
    );
}
