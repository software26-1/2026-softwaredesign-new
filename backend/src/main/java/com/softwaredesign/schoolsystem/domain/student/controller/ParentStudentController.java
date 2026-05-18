package com.softwaredesign.schoolsystem.domain.student.controller;

import com.softwaredesign.schoolsystem.domain.student.dto.ParentOfStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentOfParentResponse;
import com.softwaredesign.schoolsystem.domain.student.service.ParentStudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ParentStudentController {

    private final ParentStudentService parentStudentService;

    @GetMapping("/students/{studentId}/parents")
    public ResponseEntity<List<ParentOfStudentResponse>> getParentsByStudent(@PathVariable Long studentId) {
        List<ParentOfStudentResponse> response = parentStudentService.getParentsByStudent(studentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/parents/{parentId}/students")
    public ResponseEntity<List<StudentOfParentResponse>> getStudentsByParent(@PathVariable Long parentId) {
        List<StudentOfParentResponse> response = parentStudentService.getStudentsByParent(parentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/parent-students")
    public ResponseEntity<ParentStudentResponse> createMapping(@Valid @RequestBody ParentStudentCreateRequest request) {
        ParentStudentResponse response = parentStudentService.createMapping(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/parent-students/{mappingId}")
    public ResponseEntity<Map<String, String>> deleteMapping(@PathVariable Long mappingId) {
        parentStudentService.deleteMapping(mappingId);
        return ResponseEntity.ok(Map.of("message", "매핑 삭제 완료"));
    }
}
