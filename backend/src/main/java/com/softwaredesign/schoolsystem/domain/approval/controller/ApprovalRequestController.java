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

    // 전근/전학 신청 (교사/학생 본인)
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('TEACHER', 'STUDENT')")
    public ResponseEntity<ApprovalResponse> createTransfer(
            @RequestParam("to_school_id") Long toSchoolId,
            @RequestParam("type") RequestType type,
            @RequestParam(value = "detail", defaultValue = "") String detail,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalRequestService.createTransfer(authUser.id(), toSchoolId, type, detail));
    }

    // 전근/전학 승인/거절 (Admin - 양쪽 학교 admin이 각자 처리)
    @PatchMapping("/{requestId}/transfer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalResponse> processTransfer(
            @PathVariable Long requestId,
            @RequestParam("approve") boolean approve,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(
                approvalRequestService.processTransfer(requestId, approve, authUser.id()));
    }

    // Admin 학교별 전근/전학 신청 목록 조회
    @GetMapping("/school")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ApprovalResponse>> getBySchool(
            @RequestParam(required = false) ApprovalStatus status,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(approvalRequestService.getBySchoolForAdmin(authUser.id(), status));
    }

    // 담임 교사: 내 반 학생/학부모 가입 승인 목록
    @GetMapping("/class")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ApprovalResponse>> getClassRegistrations(
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(approvalRequestService.getClassRegistrations(authUser.id()));
    }

    // 담임 교사: 학급 이동 신청 제출 (자기 반 학생 → 같은 학교 내 다른 반)
    @PostMapping("/class-change")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApprovalResponse> submitClassChange(
            @RequestParam Long studentId,
            @RequestParam Long toClassGroupId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalRequestService.submitClassChange(authUser.id(), studentId, toClassGroupId));
    }

    // 담임 교사: 학생 전학 신청 제출 (자기 반 학생 → 다른 학교로)
    @PostMapping("/student-transfer")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApprovalResponse> submitStudentTransfer(
            @RequestParam Long studentId,
            @RequestParam Long toSchoolId,
            @RequestParam(value = "detail", defaultValue = "") String detail,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalRequestService.submitStudentTransfer(authUser.id(), studentId, toSchoolId, detail));
    }

    // 담임 교사: 학생/학부모 가입 승인 처리
    @PostMapping("/{requestId}/process-class")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApprovalResponse> processClassRegistration(
            @PathVariable Long requestId,
            @RequestParam boolean approve,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(approvalRequestService.processClassRegistration(requestId, authUser.id(), approve));
    }
}
