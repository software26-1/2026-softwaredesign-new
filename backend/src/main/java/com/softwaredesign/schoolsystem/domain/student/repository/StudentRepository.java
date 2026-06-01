package com.softwaredesign.schoolsystem.domain.student.repository;

import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findAllByIsDeletedFalse();
    List<Student> findAllBySchoolIdAndIsDeletedFalse(Long schoolId);
    List<Student> findAllByClassGroupIdAndIsDeletedFalse(Long classGroupId);
    List<Student> findAllBySchoolIdAndClassGroupIdAndIsDeletedFalse(Long schoolId, Long classGroupId);
    Optional<Student> findByUserIdAndIsDeletedFalse(Long userId);
    List<Student> findAllBySchoolIdAndClassGroupIsNullAndIsDeletedFalse(Long schoolId);

    @Query("SELECT s FROM Student s JOIN s.user u " +
           "WHERE s.isDeleted = false " +
           "AND (:schoolId IS NULL OR s.school.id = :schoolId) " +
           "AND (:grade IS NULL OR s.classGroup.grade = :grade) " +
           "AND (:classNumber IS NULL OR s.classGroup.classNumber = :classNumber) " +
           "AND (:name IS NULL OR u.name LIKE %:name%)")
    List<Student> searchStudents(@Param("schoolId") Long schoolId,
                                  @Param("grade") Integer grade,
                                  @Param("classNumber") Integer classNumber,
                                  @Param("name") String name);
}
