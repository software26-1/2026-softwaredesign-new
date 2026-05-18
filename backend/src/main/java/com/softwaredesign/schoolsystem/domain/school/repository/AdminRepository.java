package com.softwaredesign.schoolsystem.domain.school.repository;

import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUserId(Long userId);
}
