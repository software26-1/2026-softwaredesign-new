package com.softwaredesign.schoolsystem.domain.school.repository;

import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUserId(Long userId);
    Optional<Admin> findBySchoolId(Long schoolId);
    List<Admin> findAllByIsDeletedFalse();
    List<Admin> findAllBySchoolIdAndIsDeletedFalse(Long schoolId);
}
