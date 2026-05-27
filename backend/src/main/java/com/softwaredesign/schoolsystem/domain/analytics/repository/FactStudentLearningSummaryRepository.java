package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentLearningSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FactStudentLearningSummaryRepository extends JpaRepository<FactStudentLearningSummary, Long> {

    Optional<FactStudentLearningSummary> findByStudentKeyAndYearAndSemester(Long studentKey, Integer year, Integer semester);

    List<FactStudentLearningSummary> findByStudentKey(Long studentKey);

    List<FactStudentLearningSummary> findByYearAndSemesterAndRiskFlagTrue(Integer year, Integer semester);
}
