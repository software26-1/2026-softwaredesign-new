package com.softwaredesign.schoolsystem.domain.school.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.common.util.AdminSchoolResolver;
import com.softwaredesign.schoolsystem.domain.school.dto.TeacherResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.TeacherUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;
    private final AdminSchoolResolver adminSchoolResolver;

    @GetMapping
    public ResponseEntity<List<TeacherResponse>> getTeachers(
            @AuthenticationPrincipal AuthUser authUser) {
        Long schoolId = adminSchoolResolver.resolveSchoolId(authUser.id());
        List<Teacher> teachers = teacherService.getTeachers(schoolId);
        List<TeacherResponse> response = teachers.stream()
                .map(TeacherResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{teacherId}")
    public ResponseEntity<TeacherResponse> getTeacher(@PathVariable Long teacherId) {
        TeacherResponse response = teacherService.getTeacher(teacherId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{teacherId}")
    public ResponseEntity<TeacherResponse> updateTeacher(
            @PathVariable Long teacherId,
            @RequestBody TeacherUpdateRequest request) {
        TeacherResponse response = teacherService.updateTeacher(teacherId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{teacherId}")
    public ResponseEntity<Map<String, String>> deleteTeacher(@PathVariable Long teacherId) {
        teacherService.deleteTeacher(teacherId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
