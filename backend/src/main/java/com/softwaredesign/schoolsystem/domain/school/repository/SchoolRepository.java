package com.softwaredesign.schoolsystem.domain.school.repository;

import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findAllByIsDeletedIsFalse();
    List<School> findAllBySchoolTypeAndIsDeletedFalse(SchoolType schoolType);
    java.util.Optional<School> findBySchoolName(String schoolName);
}
