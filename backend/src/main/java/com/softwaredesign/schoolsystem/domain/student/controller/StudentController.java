package com.softwaredesign.schoolsystem.domain.student.controller;

import com.softwaredesign.schoolsystem.domain.student.dto.StudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentUpdateRequest;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentCreateRequest request) {
        StudentResponse response = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<StudentResponse>> getStudents(
            @RequestParam(value = "class_group_id", required = false) Long classGroupId) {
        List<Student> students = studentService.getStudents(classGroupId);
        List<StudentResponse> response = students.stream()
                .map(StudentResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<StudentResponse> getStudent(@PathVariable Long studentId) {
        StudentResponse response = studentService.getStudent(studentId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long studentId,
            @RequestBody StudentUpdateRequest request) {
        StudentResponse response = studentService.updateStudent(studentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable Long studentId) {
        studentService.deleteStudent(studentId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
