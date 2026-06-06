package com.softwaredesign.schoolsystem.domain.counseling.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingCreateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingResponse;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingUpdateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.service.CounselingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/counselings")
@RequiredArgsConstructor
public class CounselingController {

    private final CounselingService counselingService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<CounselingResponse> createCounseling(
            @Valid @RequestBody CounselingCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(counselingService.create(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<List<CounselingResponse>> getCounselings(
            @RequestParam(name = "student_id") Long studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(counselingService.getByStudent(studentId, authUser));
    }

    @GetMapping("/shared")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<CounselingResponse>> getSharedCounselings(
            @RequestParam(name = "student_name", required = false) String studentName,
            @RequestParam(name = "teacher_id", required = false) Long teacherId,
            @RequestParam(name = "start_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "end_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @AuthenticationPrincipal AuthUser authUser) {
        // 공유된 상담 + 본인 작성 상담(비공개 포함)을 함께 반환
        return ResponseEntity.ok(
                counselingService.searchVisible(authUser.id(), studentName, teacherId, startDate, endDate));
    }

    @PatchMapping("/{counselingId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<CounselingResponse> updateCounseling(
            @PathVariable Long counselingId,
            @RequestBody CounselingUpdateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(counselingService.update(counselingId, request, authUser.id()));
    }

    @DeleteMapping("/{counselingId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, String>> deleteCounseling(
            @PathVariable Long counselingId,
            @AuthenticationPrincipal AuthUser authUser) {
        counselingService.delete(counselingId, authUser.id());
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
