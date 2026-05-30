package com.softwaredesign.schoolsystem.domain.grade.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeSummaryResponse;
import com.softwaredesign.schoolsystem.domain.grade.service.GradeSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grade-summaries")
@RequiredArgsConstructor
public class GradeSummaryController {

    private final GradeSummaryService gradeSummaryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<GradeSummaryResponse>> getByClassGroup(
            @RequestParam(name = "class_group_id") Long classGroupId,
            @RequestParam(name = "year") int year,
            @RequestParam(name = "semester") int semester) {
        return ResponseEntity.ok(gradeSummaryService.getByClassGroup(classGroupId, year, semester));
    }

    @GetMapping("/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<GradeSummaryResponse> getByStudent(
            @PathVariable Long studentId,
            @RequestParam(name = "year") int year,
            @RequestParam(name = "semester") int semester,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(gradeSummaryService.getByStudent(studentId, year, semester, authUser));
    }
}
