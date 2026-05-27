package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FactStudentCourseTermRepository extends JpaRepository<FactStudentCourseTerm, Long> {

    List<FactStudentCourseTerm> findByStudentKeyAndYearAndSemester(Long studentKey, Integer year, Integer semester);

    List<FactStudentCourseTerm> findByStudentKeyAndCourseKeyOrderByYearAscSemesterAsc(Long studentKey, Long courseKey);

    List<FactStudentCourseTerm> findByCourseKeyAndYearAndSemester(Long courseKey, Integer year, Integer semester);
}
