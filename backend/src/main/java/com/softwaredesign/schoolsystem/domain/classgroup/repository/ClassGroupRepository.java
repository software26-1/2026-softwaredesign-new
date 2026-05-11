package com.softwaredesign.schoolsystem.domain.classgroup.repository;


import com.softwaredesign.schoolsystem.domain.classgroup.entity.ClassGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    List<ClassGroup> findAllBySchoolIdAndIsDeletedFalse(Long schoolId);
    List<ClassGroup> findAllBySchoolIdAndAcademicYearAndIsDeletedFalse(Long schoolId, int academicYear);
    List<ClassGroup> findAllBySchoolIdAndGradeAndIsDeletedFalse(Long schoolId, int grade);
    List<ClassGroup> findAllBySchoolIdAndAcademicYearAndGradeAndIsDeletedFalse(Long schoolId, int academicYear, int grade);
}
