package com.softwaredesign.schoolsystem.domain.academic.service;

import com.softwaredesign.schoolsystem.domain.academic.dto.CourseCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.academic.repository.CourseRepository;
import com.softwaredesign.schoolsystem.domain.academic.repository.CurriculumRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;
    private final CurriculumRepository curriculumRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request) {
        Curriculum curriculum = curriculumRepository.findById(request.getCurriculumId())
                .orElseThrow(() -> new IllegalArgumentException("교과를 찾을 수 없습니다. id=" + request.getCurriculumId()));

        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. id=" + request.getTeacherId()));

        School school = schoolRepository.findById(request.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + request.getSchoolId()));

        Course course = Course.createCourse(
                curriculum, teacher, school,
                request.getCourseType(), request.getCourseName(),
                request.getAcademicYear(), request.getSemester(),
                request.getMidtermRatio(), request.getFinalRatio(), request.getTaskRatio()
        );
        courseRepository.save(course);
        return CourseResponse.from(course);
    }

    public List<Course> getCourses(int academicYear, int semester, Long teacherId) {
        if (teacherId != null) {
            return courseRepository.findAllByAcademicYearAndSemesterAndTeacherIdAndIsDeletedFalse(
                    academicYear, semester, teacherId);
        }
        return courseRepository.findAllByAcademicYearAndSemesterAndIsDeletedFalse(academicYear, semester);
    }

    @Transactional
    public CourseResponse updateCourse(Long courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("개설과목을 찾을 수 없습니다. id=" + courseId));

        course.updateCourse(
                request.getCourseName(), request.getCourseType(),
                request.getMidtermRatio(), request.getFinalRatio(), request.getTaskRatio()
        );
        return CourseResponse.from(course);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("개설과목을 찾을 수 없습니다."));
        course.softDelete();
    }
}
