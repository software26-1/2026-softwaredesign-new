package com.softwaredesign.schoolsystem.domain.academic.repository;

import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByAcademicYearAndSemesterAndIsDeletedFalse(int academicYear, int semester);
    List<Course> findAllByAcademicYearAndSemesterAndTeacherIdAndIsDeletedFalse(int academicYear, int semester, Long teacherId);
    List<Course> findAllByAcademicYearAndSemesterAndTeacherIsNullAndIsDeletedFalse(int academicYear, int semester);
}
