package com.softwaredesign.schoolsystem.domain.school.repository;

import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    java.util.Optional<Teacher> findByUserId(Long userId);
}
