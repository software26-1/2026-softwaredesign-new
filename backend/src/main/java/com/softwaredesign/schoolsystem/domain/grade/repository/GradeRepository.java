package com.softwaredesign.schoolsystem.domain.grade.repository;

import com.softwaredesign.schoolsystem.domain.grade.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudentId(Long studentId);
    List<Grade> findByEnrollmentId(Long enrollmentId);
    List<Grade> findByStudentIdAndEnrollmentId(Long studentId, Long enrollmentId);
    Optional<Grade> findTopByStudentIdOrderByCreatedAtDesc(Long studentId);
}
