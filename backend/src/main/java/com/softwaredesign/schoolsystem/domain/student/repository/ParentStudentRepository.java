package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, Long> {
    List<ParentStudent> findAllByStudentIdAndIsDeletedFalse(Long studentId);
    List<ParentStudent> findAllByParentIdAndIsDeletedFalse(Long parentId);
}
