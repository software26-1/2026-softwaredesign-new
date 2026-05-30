package com.softwaredesign.schoolsystem.domain.user.repository;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import com.softwaredesign.schoolsystem.domain.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByStatus(UserStatus status);
    List<User> findByRole(UserRole role);
    List<User> findByStatusAndRole(UserStatus status, UserRole role);
    List<User> findBySchoolName(String schoolName);
    List<User> findBySchoolNameAndStatus(String schoolName, UserStatus status);
    List<User> findBySchoolNameAndRole(String schoolName, UserRole role);
    List<User> findBySchoolNameAndStatusAndRole(String schoolName, UserStatus status, UserRole role);
}
