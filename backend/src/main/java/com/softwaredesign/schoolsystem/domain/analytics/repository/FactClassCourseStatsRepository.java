package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactClassCourseStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FactClassCourseStatsRepository extends JpaRepository<FactClassCourseStats, Long> {

    List<FactClassCourseStats> findByClassGroupIdAndYearAndSemester(Long classGroupId, Integer year, Integer semester);
}
