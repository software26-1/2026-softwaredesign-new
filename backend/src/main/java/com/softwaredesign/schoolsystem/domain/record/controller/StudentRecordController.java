package com.softwaredesign.schoolsystem.domain.record.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordCreateOrUpdateRequest;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordResponse;
import com.softwaredesign.schoolsystem.domain.record.service.StudentRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-records")
@RequiredArgsConstructor
public class StudentRecordController {

    private final StudentRecordService studentRecordService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'STUDENT', 'PARENT')")
    public ResponseEntity<StudentRecordResponse> getStudentRecord(
            @RequestParam(name = "student_id", required = false) Long studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(studentRecordService.getByStudent(studentId, authUser));
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentRecordResponse> upsertStudentRecord(
            @RequestParam(name = "student_id") Long studentId,
            @RequestBody StudentRecordCreateOrUpdateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(studentRecordService.upsert(studentId, request, authUser.id()));
    }
}
