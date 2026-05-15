package com.softwaredesign.schoolsystem.domain.academic.controller;

import com.softwaredesign.schoolsystem.domain.academic.dto.EnrollmentCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.EnrollmentResponse;
import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import com.softwaredesign.schoolsystem.domain.academic.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/api/courses/{courseId}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<EnrollmentResponse> createEnrollment(
            @PathVariable Long courseId,
            @Valid @RequestBody EnrollmentCreateRequest request) {
        EnrollmentResponse response = enrollmentService.createEnrollment(courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/courses/{courseId}/enrollments")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollments(@PathVariable Long courseId) {
        List<Enrollment> enrollments = enrollmentService.getEnrollments(courseId);
        List<EnrollmentResponse> response = enrollments.stream()
                .map(EnrollmentResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/enrollments/{enrollmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> cancelEnrollment(@PathVariable Long enrollmentId) {
        enrollmentService.cancelEnrollment(enrollmentId);
        return ResponseEntity.ok(Map.of("message", "수강 취소 완료"));
    }
}
