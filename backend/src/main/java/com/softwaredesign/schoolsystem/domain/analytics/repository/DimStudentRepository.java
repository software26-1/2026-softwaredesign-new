package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.DimStudent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DimStudentRepository extends JpaRepository<DimStudent, Long> {
}
