package com.softwaredesign.schoolsystem.domain.approval.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalCreateRequest;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalProcessRequest;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalResponse;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.approval.service.ApprovalRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval-requests")
@RequiredArgsConstructor
public class ApprovalRequestController {

    private final ApprovalRequestService approvalRequestService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApprovalResponse> create(
            @Valid @RequestBody ApprovalCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalRequestService.create(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<ApprovalResponse>> getAll(
            @RequestParam(name = "status", required = false) ApprovalStatus status,
            @RequestParam(name = "request_type", required = false) RequestType requestType) {
        return ResponseEntity.ok(approvalRequestService.getAll(status, requestType));
    }

    @PatchMapping("/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalResponse> process(
            @PathVariable Long requestId,
            @Valid @RequestBody ApprovalProcessRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(
                approvalRequestService.process(requestId, request.getStatus(), authUser.id()));
    }
}
