package com.softwaredesign.schoolsystem.domain.attendance.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceCreateRequest;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceResponse;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceSummaryResponse;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceUpdateRequest;
import com.softwaredesign.schoolsystem.domain.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendances")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<AttendanceResponse> createAttendance(
            @Valid @RequestBody AttendanceCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceService.createAttendance(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<List<AttendanceResponse>> getAttendances(
            @RequestParam(name = "student_id", required = false) Long studentId,
            @RequestParam(name = "class_group_id", required = false) Long classGroupId,
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal AuthUser authUser) {
        if (classGroupId != null && date != null) {
            return ResponseEntity.ok(attendanceService.getByClassGroupAndDate(classGroupId, date));
        }
        if (classGroupId != null && from != null && to != null) {
            return ResponseEntity.ok(attendanceService.getByClassGroupAndDateRange(classGroupId, from, to));
        }
        return ResponseEntity.ok(attendanceService.getByStudent(studentId, from, to, authUser));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<AttendanceSummaryResponse> getSummary(
            @RequestParam(name = "student_id", required = false) Long studentId,
            @RequestParam(name = "from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(attendanceService.getSummary(studentId, from, to, authUser));
    }

    @PatchMapping("/{attendanceId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<AttendanceResponse> updateAttendance(
            @PathVariable Long attendanceId,
            @RequestBody AttendanceUpdateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(attendanceService.updateAttendance(attendanceId, request, authUser.id()));
    }

    @DeleteMapping("/{attendanceId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, String>> deleteAttendance(
            @PathVariable Long attendanceId,
            @AuthenticationPrincipal AuthUser authUser) {
        attendanceService.deleteAttendance(attendanceId, authUser.id());
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
