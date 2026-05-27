package com.softwaredesign.schoolsystem.domain.feedback.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackCreateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackUpdateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import com.softwaredesign.schoolsystem.domain.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<FeedbackResponse> createFeedback(
            @Valid @RequestBody FeedbackCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feedbackService.createFeedback(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'STUDENT', 'PARENT', 'ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getFeedbacks(
            @RequestParam(name = "student_id") Long studentId,
            @RequestParam(name = "category", required = false) FeedbackType category,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(feedbackService.getByStudent(studentId, category, authUser));
    }

    @PatchMapping("/{feedbackId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<FeedbackResponse> updateFeedback(
            @PathVariable Long feedbackId,
            @RequestBody FeedbackUpdateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(feedbackService.updateFeedback(feedbackId, request, authUser.id()));
    }

    @DeleteMapping("/{feedbackId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, String>> deleteFeedback(
            @PathVariable Long feedbackId,
            @AuthenticationPrincipal AuthUser authUser) {
        feedbackService.deleteFeedback(feedbackId, authUser.id());
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
