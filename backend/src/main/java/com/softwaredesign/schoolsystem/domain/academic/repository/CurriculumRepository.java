package com.softwaredesign.schoolsystem.domain.academic.repository;

import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
    List<Curriculum> findAllByIsDeletedIsFalse();
    List<Curriculum> findAllBySchoolTypeAndIsDeletedFalse(SchoolType schoolType);
}
