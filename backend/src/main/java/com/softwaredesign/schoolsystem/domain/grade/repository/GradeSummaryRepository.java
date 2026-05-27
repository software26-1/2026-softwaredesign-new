package com.softwaredesign.schoolsystem.domain.grade.repository;

import com.softwaredesign.schoolsystem.domain.grade.entity.GradeSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeSummaryRepository extends JpaRepository<GradeSummary, Long> {
    List<GradeSummary> findByClassGroupIdAndYearAndSemester(Long classGroupId, int year, int semester);
    Optional<GradeSummary> findByStudentIdAndYearAndSemester(Long studentId, int year, int semester);
}
