package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {
}
