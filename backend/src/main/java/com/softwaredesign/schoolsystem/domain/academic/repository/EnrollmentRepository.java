package com.softwaredesign.schoolsystem.domain.academic.repository;

import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findAllByCourseIdAndIsDeletedFalse(Long courseId);
    boolean existsByCourseIdAndStudentIdAndIsDeletedFalse(Long courseId, Long studentId);

    /** 학생이 해당 교사가 담당하는 과목 중 하나라도 수강 중인지 (학생부 권한 확인용). */
    boolean existsByStudentIdAndCourse_Teacher_IdAndIsDeletedFalse(Long studentId, Long teacherId);
}
