package com.softwaredesign.schoolsystem.domain.academic.service;

import com.softwaredesign.schoolsystem.domain.academic.dto.EnrollmentCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.EnrollmentResponse;
import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import com.softwaredesign.schoolsystem.domain.academic.repository.CourseRepository;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public EnrollmentResponse createEnrollment(Long courseId, EnrollmentCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("개설과목을 찾을 수 없습니다. id=" + courseId));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. id=" + request.getStudentId()));

        if (enrollmentRepository.existsByCourseIdAndStudentIdAndIsDeletedFalse(courseId, request.getStudentId())) {
            throw new IllegalArgumentException("이미 해당 과목에 수강 등록되어 있습니다.");
        }

        Enrollment enrollment = Enrollment.createEnrollment(course, student);
        enrollmentRepository.save(enrollment);
        return EnrollmentResponse.from(enrollment);
    }

    public List<Enrollment> getEnrollments(Long courseId) {
        return enrollmentRepository.findAllByCourseIdAndIsDeletedFalse(courseId);
    }

    @Transactional
    public void cancelEnrollment(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("수강 정보를 찾을 수 없습니다. id=" + enrollmentId));
        enrollment.softDelete();
    }
}
