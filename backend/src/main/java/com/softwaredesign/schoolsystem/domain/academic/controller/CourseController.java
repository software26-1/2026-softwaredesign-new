package com.softwaredesign.schoolsystem.domain.academic.controller;

import com.softwaredesign.schoolsystem.domain.academic.dto.CourseCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        CourseResponse response = courseService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<CourseResponse>> getCourses(
            @RequestParam(name = "academic_year") int academicYear,
            @RequestParam(name = "semester") int semester,
            @RequestParam(name = "teacher_id", required = false) Long teacherId) {
        List<Course> courses = courseService.getCourses(academicYear, semester, teacherId);
        List<CourseResponse> response = courses.stream()
                .map(CourseResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long courseId,
            @RequestBody CourseUpdateRequest request) {
        CourseResponse response = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCourse(@PathVariable Long courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
