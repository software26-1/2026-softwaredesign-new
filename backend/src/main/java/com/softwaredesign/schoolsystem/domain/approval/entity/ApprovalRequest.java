package com.softwaredesign.schoolsystem.domain.approval.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApprovalRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 30, nullable = false)
    private RequestType requestType;

    @Column(name = "request_detail", columnDefinition = "TEXT", nullable = false)
    private String requestDetail;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ApprovalStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_school_id")
    private School fromSchool;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_school_id")
    private School toSchool;

    @Column(name = "from_school_status", length = 20)
    private String fromSchoolStatus;

    @Column(name = "to_school_status", length = 20)
    private String toSchoolStatus;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public static ApprovalRequest create(User requester, RequestType requestType, String requestDetail) {
        ApprovalRequest request = new ApprovalRequest();
        request.requester = requester;
        request.requestType = requestType;
        request.requestDetail = requestDetail;
        request.status = ApprovalStatus.PENDING;
        return request;
    }

    public static ApprovalRequest createTransfer(User requester, RequestType requestType, String requestDetail, School fromSchool, School toSchool) {
        ApprovalRequest request = new ApprovalRequest();
        request.requester = requester;
        request.requestType = requestType;
        request.requestDetail = requestDetail;
        request.status = ApprovalStatus.PENDING;
        request.fromSchool = fromSchool;
        request.toSchool = toSchool;
        request.fromSchoolStatus = "PENDING";
        request.toSchoolStatus = "PENDING";
        return request;
    }

    public void process(User approver, ApprovalStatus newStatus) {
        this.approver = approver;
        this.status = newStatus;
        this.processedAt = LocalDateTime.now();
    }

    public void approveFromSchool() {
        this.fromSchoolStatus = "APPROVED";
        checkBothApproved();
    }

    public void approveToSchool() {
        this.toSchoolStatus = "APPROVED";
        checkBothApproved();
    }

    public void rejectFromSchool() {
        this.fromSchoolStatus = "REJECTED";
        this.status = ApprovalStatus.REJECTED;
        this.processedAt = LocalDateTime.now();
    }

    public void rejectToSchool() {
        this.toSchoolStatus = "REJECTED";
        this.status = ApprovalStatus.REJECTED;
        this.processedAt = LocalDateTime.now();
    }

    private void checkBothApproved() {
        if ("APPROVED".equals(fromSchoolStatus) && "APPROVED".equals(toSchoolStatus)) {
            this.status = ApprovalStatus.APPROVED;
            this.processedAt = LocalDateTime.now();
        }
    }

    public boolean isBothApproved() {
        return ApprovalStatus.APPROVED == this.status;
    }
}
