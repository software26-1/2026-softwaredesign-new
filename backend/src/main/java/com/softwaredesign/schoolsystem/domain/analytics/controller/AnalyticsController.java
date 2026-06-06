package com.softwaredesign.schoolsystem.domain.analytics.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.analytics.dto.*;
import com.softwaredesign.schoolsystem.domain.analytics.service.AnalyticsEtlService;
import com.softwaredesign.schoolsystem.domain.analytics.service.AnalyticsQueryService;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsQueryService analyticsQueryService;
    private final AnalyticsEtlService analyticsEtlService;
    private final StudentAccessGuard studentAccessGuard;

    @GetMapping("/students/{studentId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<LearningSummaryResponse> getStudentSummary(
            @PathVariable Long studentId,
            @RequestParam(name = "year") Integer year,
            @RequestParam(name = "semester") Integer semester,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        return ResponseEntity.ok(analyticsQueryService.getStudentSummary(studentId, year, semester));
    }

    @GetMapping("/students/{studentId}/courses/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<List<StudentCourseTermResponse>> getAllStudentCourses(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        return ResponseEntity.ok(analyticsQueryService.getAllStudentCourses(studentId));
    }

    @GetMapping("/students/{studentId}/courses")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<List<StudentCourseTermResponse>> getStudentCourses(
            @PathVariable Long studentId,
            @RequestParam(name = "year") Integer year,
            @RequestParam(name = "semester") Integer semester,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        return ResponseEntity.ok(analyticsQueryService.getStudentCourses(studentId, year, semester));
    }

    @GetMapping("/students/{studentId}/trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<List<ScoreTrendPointResponse>> getStudentTrend(
            @PathVariable Long studentId,
            @RequestParam(name = "course_id") Long courseId,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        return ResponseEntity.ok(analyticsQueryService.getStudentTrend(studentId, courseId));
    }

    @GetMapping("/classes/{classGroupId}/courses")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<ClassCourseStatsResponse>> getClassCourses(
            @PathVariable Long classGroupId,
            @RequestParam(name = "year") Integer year,
            @RequestParam(name = "semester") Integer semester,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessClass(authUser, classGroupId);
        return ResponseEntity.ok(analyticsQueryService.getClassCourses(classGroupId, year, semester));
    }

    @GetMapping("/classes/{classGroupId}/at-risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<LearningSummaryResponse>> getAtRiskStudents(
            @PathVariable Long classGroupId,
            @RequestParam(name = "year") Integer year,
            @RequestParam(name = "semester") Integer semester,
            @AuthenticationPrincipal AuthUser authUser) {
        studentAccessGuard.requireCanAccessClass(authUser, classGroupId);
        // classGroupId currently scopes the request semantically; the at-risk set
        // is filtered by term + risk flag. TODO: filter by class_group_id once the
        // summary fact carries it.
        return ResponseEntity.ok(analyticsQueryService.getAtRiskStudents(year, semester));
    }

    @GetMapping("/courses/{courseId}/distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<ScoreDistributionResponse>> getCourseDistribution(
            @PathVariable Long courseId,
            @RequestParam(name = "year") Integer year,
            @RequestParam(name = "semester") Integer semester) {
        return ResponseEntity.ok(analyticsQueryService.getCourseDistribution(courseId, year, semester));
    }

    @PostMapping("/etl/run")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EtlJobLogResponse> runEtl() {
        return ResponseEntity.ok(EtlJobLogResponse.from(analyticsEtlService.triggerEtl()));
    }
}
