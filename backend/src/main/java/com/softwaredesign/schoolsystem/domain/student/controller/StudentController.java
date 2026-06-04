package com.softwaredesign.schoolsystem.domain.student.controller;

import com.softwaredesign.schoolsystem.domain.counseling.repository.CounselingRepository;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.grade.entity.Grade;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeRepository;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentUpdateRequest;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.common.util.AdminSchoolResolver;
import com.softwaredesign.schoolsystem.domain.student.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final AdminSchoolResolver adminSchoolResolver;
    private final FeedbackRepository feedbackRepository;
    private final CounselingRepository counselingRepository;
    private final GradeRepository gradeRepository;
    private final com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository teacherRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentCreateRequest request) {
        StudentResponse response = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<StudentResponse>> getStudents(
            @RequestParam(value = "class_group_id", required = false) Long classGroupId,
            @RequestParam(value = "grade", required = false) Integer grade,
            @RequestParam(value = "class_number", required = false) Integer classNumber,
            @RequestParam(value = "name", required = false) String name,
            @AuthenticationPrincipal AuthUser authUser) {
        Long schoolId = teacherRepository.findByUserId(authUser.id())
                .map(t -> t.getSchool() != null ? t.getSchool().getId() : null)
                .orElse(null);
        List<Student> students = studentService.getStudents(schoolId, classGroupId, grade, classNumber, name);
        List<StudentResponse> response = students.stream().map(s -> {
            long feedbackCount = feedbackRepository.countByStudentId(s.getId());
            long counselingCount = counselingRepository.countByStudentId(s.getId());
            BigDecimal recentScore = gradeRepository
                    .findTopByStudentIdOrderByCreatedAtDesc(s.getId())
                    .map(Grade::getScore)
                    .orElse(null);
            return StudentResponse.from(s, recentScore, feedbackCount, counselingCount);
        }).toList();
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

    @GetMapping("/unassigned")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentResponse>> getUnassignedStudents(
            @AuthenticationPrincipal AuthUser authUser) {
        Long schoolId = adminSchoolResolver.resolveSchoolId(authUser.id());
        return ResponseEntity.ok(studentService.getUnassignedStudents(schoolId));
    }

    @PatchMapping("/{studentId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> assignClassGroup(
            @PathVariable Long studentId,
            @RequestBody Map<String, Integer> body) {
        Long classGroupId = Long.valueOf(body.get("classGroupId"));
        Integer studentNumber = body.get("studentNumber");
        return ResponseEntity.ok(studentService.assignClassGroup(studentId, classGroupId, studentNumber));
    }
}
