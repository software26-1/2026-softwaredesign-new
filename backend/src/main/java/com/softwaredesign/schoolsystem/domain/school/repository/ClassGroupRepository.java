package com.softwaredesign.schoolsystem.domain.school.repository;


import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    Optional<ClassGroup> findByHomeroomTeacherIdAndIsDeletedFalse(Long teacherId);
    Optional<ClassGroup> findBySchoolSchoolNameAndGradeAndClassNumberAndIsDeletedFalse(String schoolName, int grade, int classNumber);
    List<ClassGroup> findAllBySchoolIdAndIsDeletedFalse(Long schoolId);
    List<ClassGroup> findAllBySchoolIdAndAcademicYearAndIsDeletedFalse(Long schoolId, int academicYear);
    List<ClassGroup> findAllBySchoolIdAndGradeAndIsDeletedFalse(Long schoolId, int grade);
    List<ClassGroup> findAllBySchoolIdAndAcademicYearAndGradeAndIsDeletedFalse(Long schoolId, int academicYear, int grade);
}
