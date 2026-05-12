package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findAllByIsDeletedFalse();
    List<Student> findAllByClassGroupIdAndIsDeletedFalse(Long classGroupId);
    Optional<Student> findByUserIdAndIsDeletedFalse(Long userId);
}
