package com.softwaredesign.schoolsystem.domain.academic.service;

import com.softwaredesign.schoolsystem.domain.academic.dto.CourseCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CourseUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.academic.entity.CourseType;
import com.softwaredesign.schoolsystem.domain.academic.repository.CourseRepository;
import com.softwaredesign.schoolsystem.domain.academic.repository.CurriculumRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.AdminRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
    private final AdminRepository adminRepository;

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, Long adminUserId) {
        Curriculum curriculum = curriculumRepository.findById(request.getCurriculumId())
                .orElseThrow(() -> new IllegalArgumentException("교과를 찾을 수 없습니다."));

        Teacher teacher = request.getTeacherId() != null
                ? teacherRepository.findById(request.getTeacherId()).orElse(null)
                : null;

        School school = resolveSchool(request.getSchoolId(), adminUserId);

        CourseType courseType = request.getCourseType() != null ? request.getCourseType() : CourseType.ELECTIVE;

        Course course = Course.createCourse(
                curriculum, teacher, school,
                courseType, request.getCourseName(),
                request.getAcademicYear(), request.getSemester(),
                request.getMidtermRatio(), request.getFinalRatio(), request.getTaskRatio(),
                request.getGrade(), request.getEvaluationType()
        );
        courseRepository.save(course);
        return CourseResponse.from(course);
    }

    @Transactional
    public CourseResponse claimCourse(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다."));
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new AccessDeniedException("교사를 찾을 수 없습니다."));
        if (course.getTeacher() != null) {
            throw new IllegalStateException("이미 담당 교사가 배정된 과목입니다.");
        }
        course.assignTeacher(teacher);
        return CourseResponse.from(course);
    }

    public List<Course> getAvailableCourses(int academicYear, int semester) {
        return courseRepository.findAllByAcademicYearAndSemesterAndTeacherIsNullAndIsDeletedFalse(academicYear, semester);
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
                .orElseThrow(() -> new IllegalArgumentException("개설과목을 찾을 수 없습니다."));
        course.updateCourse(
                request.getCourseName(), request.getCourseType(),
                request.getMidtermRatio(), request.getFinalRatio(), request.getTaskRatio()
        );
        if (request.getTeacherId() != null) {
            Teacher teacher = request.getTeacherId() == 0L ? null
                    : teacherRepository.findById(request.getTeacherId()).orElse(null);
            course.assignTeacher(teacher);
        }
        return CourseResponse.from(course);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("개설과목을 찾을 수 없습니다."));
        course.softDelete();
    }

    private School resolveSchool(Long schoolId, Long adminUserId) {
        if (schoolId != null) {
            return schoolRepository.findById(schoolId).orElse(null);
        }
        return adminRepository.findByUserId(adminUserId)
                .map(a -> a.getSchool())
                .orElse(null);
    }
}
