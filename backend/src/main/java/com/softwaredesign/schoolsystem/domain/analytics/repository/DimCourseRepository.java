package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.DimCourse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DimCourseRepository extends JpaRepository<DimCourse, Long> {
}
