package com.softwaredesign.schoolsystem.domain.school.repository;

import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUserId(Long userId);
    List<Teacher> findAllByIsDeletedFalse();
    List<Teacher> findAllBySchoolIdAndIsDeletedFalse(Long schoolId);
}
