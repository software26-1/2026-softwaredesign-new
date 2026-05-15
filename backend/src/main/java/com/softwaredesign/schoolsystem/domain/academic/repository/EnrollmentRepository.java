package com.softwaredesign.schoolsystem.domain.academic.repository;

import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findAllByCourseIdAndIsDeletedFalse(Long courseId);
    boolean existsByCourseIdAndStudentIdAndIsDeletedFalse(Long courseId, Long studentId);
}
