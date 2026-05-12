package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, Long> {
}
