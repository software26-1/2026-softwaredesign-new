package com.softwaredesign.schoolsystem.domain.grade.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeCreateRequest;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeResponse;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeUpdateRequest;
import com.softwaredesign.schoolsystem.domain.grade.service.GradeService;
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
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GradeResponse> createGrade(
            @Valid @RequestBody GradeCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gradeService.createGrade(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<GradeResponse>> getGrades(
            @RequestParam(name = "student_id", required = false) Long studentId,
            @RequestParam(name = "enrollment_id", required = false) Long enrollmentId) {
        if (enrollmentId != null) {
            return ResponseEntity.ok(gradeService.getGradesByEnrollment(enrollmentId));
        }
        return ResponseEntity.ok(gradeService.getGradesByStudent(studentId));
    }

    @PatchMapping("/{gradeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GradeResponse> updateGrade(
            @PathVariable Long gradeId,
            @RequestBody GradeUpdateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(gradeService.updateGrade(gradeId, request, authUser.id()));
    }

    @DeleteMapping("/{gradeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, String>> deleteGrade(
            @PathVariable Long gradeId,
            @AuthenticationPrincipal AuthUser authUser) {
        gradeService.deleteGrade(gradeId, authUser.id());
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
