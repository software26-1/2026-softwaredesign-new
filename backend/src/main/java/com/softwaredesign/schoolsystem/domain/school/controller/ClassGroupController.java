package com.softwaredesign.schoolsystem.domain.school.controller;

import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupCreateRequest;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.service.ClassGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ClassGroupController {

    private final ClassGroupService classGroupService;

    // /api/schools/{schoolId}/class-groups
    @PostMapping("/schools/{schoolId}/class-groups")
    public ResponseEntity<ClassGroupResponse> createClassGroup(
            @PathVariable Long schoolId,
            @Valid @RequestBody ClassGroupCreateRequest request) {

        ClassGroupResponse response = classGroupService.createClassGroup(schoolId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // /api/schools/{schoolId}/class-groups
    @GetMapping("/schools/{schoolId}/class-groups")
    public ResponseEntity<List<ClassGroupResponse>> getClassGroups(
            @PathVariable Long schoolId,
            @RequestParam(value = "academic_year", required = false) Integer academicYear,
            @RequestParam(value = "grade", required = false) Integer grade) {
        List<ClassGroup> classGroups = classGroupService.getClassGroups(schoolId, academicYear, grade);
        List<ClassGroupResponse> response = classGroups.stream()
                .map(ClassGroupResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    // /api/class-groups/{classGroupId}
    @PatchMapping("/class-groups/{classGroupId}")
    public ResponseEntity<ClassGroupResponse> updateClassGroup(
            @PathVariable Long classGroupId,
            @RequestBody ClassGroupUpdateRequest request) {
        ClassGroupResponse response = classGroupService.updateClassGroup(classGroupId, request);
        return ResponseEntity.ok(response);
    }

    // /api/class-groups/{classGroupId}
    @DeleteMapping("/class-groups/{classGroupId}")
    public ResponseEntity<Map<String, String>> deleteClassGroup(@PathVariable Long classGroupId) {
        classGroupService.deleteClassGroup(classGroupId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }

    // /api/class-groups/{classGroupId}/homeroom-teacher
    @PatchMapping("/class-groups/{classGroupId}/homeroom-teacher")
    public ResponseEntity<ClassGroupResponse> assignHomeroomTeacher(
            @PathVariable Long classGroupId,
            @RequestBody Map<String, Long> body) {
        Long teacherId = body.get("teacherId");
        ClassGroupResponse response = classGroupService.assignHomeroomTeacher(classGroupId, teacherId);
        return ResponseEntity.ok(response);
    }
}

