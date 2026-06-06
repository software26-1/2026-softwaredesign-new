package com.softwaredesign.schoolsystem.domain.academic.controller;

import com.softwaredesign.schoolsystem.domain.academic.dto.CourseCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.service.CourseService;
import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
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
@RequiredArgsConstructor
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final TeacherRepository teacherRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        CourseResponse response = courseService.createCourse(request, authUser.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/for-class")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<CourseResponse>> getCoursesForClass(
            @RequestParam(name = "academic_year") int academicYear,
            @RequestParam(name = "semester") int semester,
            @RequestParam(name = "grade", required = false) Integer grade) {
        List<Course> courses = courseService.getCourses(academicYear, semester, null)
                .stream()
                .filter(c -> grade == null || grade.equals(c.getGrade()))
                .toList();
        return ResponseEntity.ok(courses.stream().map(CourseResponse::from).toList());
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<CourseResponse>> getAvailableCourses(
            @RequestParam(name = "academic_year") int academicYear,
            @RequestParam(name = "semester") int semester) {
        List<Course> courses = courseService.getAvailableCourses(academicYear, semester);
        return ResponseEntity.ok(courses.stream().map(CourseResponse::from).toList());
    }

    @PostMapping("/{courseId}/claim")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<CourseResponse> claimCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(courseService.claimCourse(courseId, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<CourseResponse>> getCourses(
            @RequestParam(name = "academic_year") int academicYear,
            @RequestParam(name = "semester") int semester,
            @RequestParam(name = "teacher_id", required = false) Long teacherId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (teacherId == null && "TEACHER".equals(authUser.role())) {
            teacherId = teacherRepository.findByUserId(authUser.id())
                    .map(t -> t.getId()).orElse(null);
        }
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
