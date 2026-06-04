package com.softwaredesign.schoolsystem.domain.student.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentOfStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentOfParentResponse;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.service.ParentStudentService;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class ParentStudentController {

    private final ParentStudentService parentStudentService;
    private final ParentRepository parentRepository;
    private final UserRepository userRepository;

    // 학부모 본인 자녀 조회
    @GetMapping("/parents/me/students")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<List<StudentOfParentResponse>> getMyStudents(@AuthenticationPrincipal AuthUser authUser) {
        Long parentId = parentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                .orElseThrow(() -> new IllegalArgumentException("학부모 정보를 찾을 수 없습니다."))
                .getId();
        return ResponseEntity.ok(parentStudentService.getStudentsByParent(parentId));
    }

    // 학부모 이름 검색 (교사/관리자)
    @GetMapping("/parents/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> searchParents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String schoolName) {
        var results = userRepository.findAll().stream()
                .filter(u -> "PARENT".equals(u.getRole() != null ? u.getRole().name() : ""))
                .filter(u -> name == null || u.getName().contains(name))
                .filter(u -> schoolName == null || schoolName.isBlank()
                        || (u.getSchoolName() != null && u.getSchoolName().equals(schoolName)))
                .map(u -> {
                    Long parentId = parentRepository.findByUserIdAndIsDeletedFalse(u.getId())
                            .map(p -> p.getId()).orElse(null);
                    return Map.<String, Object>of(
                            "userId", u.getId(),
                            "parentId", parentId != null ? parentId : 0L,
                            "name", u.getName(),
                            "email", u.getEmail() != null ? u.getEmail() : ""
                    );
                })
                .filter(m -> (Long) m.get("parentId") != 0L)
                .toList();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/students/{studentId}/parents")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<ParentOfStudentResponse>> getParentsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(parentStudentService.getParentsByStudent(studentId));
    }

    @GetMapping("/parents/{parentId}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<StudentOfParentResponse>> getStudentsByParent(@PathVariable Long parentId) {
        return ResponseEntity.ok(parentStudentService.getStudentsByParent(parentId));
    }

    @PostMapping("/parent-students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ParentStudentResponse> createMapping(@Valid @RequestBody ParentStudentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parentStudentService.createMapping(request));
    }

    @DeleteMapping("/parent-students/{mappingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> deleteMapping(@PathVariable Long mappingId) {
        parentStudentService.deleteMapping(mappingId);
        return ResponseEntity.ok(Map.of("message", "매핑 삭제 완료"));
    }
}
