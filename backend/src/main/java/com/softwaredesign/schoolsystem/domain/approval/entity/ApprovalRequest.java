package com.softwaredesign.schoolsystem.domain.approval.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
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

    public void process(User approver, ApprovalStatus newStatus) {
        this.approver = approver;
        this.status = newStatus;
        this.processedAt = LocalDateTime.now();
    }
}
