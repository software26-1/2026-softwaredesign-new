package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentRepository extends JpaRepository<Parent, Long> {
}
