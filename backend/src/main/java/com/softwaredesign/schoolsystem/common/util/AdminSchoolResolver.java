package com.softwaredesign.schoolsystem.common.util;

import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import com.softwaredesign.schoolsystem.domain.school.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Resolves the school_id for the currently authenticated ADMIN user.
 * Returns null if the admin has no school assignment (should not happen in production).
 */
@Component
@RequiredArgsConstructor
public class AdminSchoolResolver {

    private final AdminRepository adminRepository;

    public Long resolveSchoolId(Long adminUserId) {
        return adminRepository.findByUserId(adminUserId)
                .map(Admin::getSchool)
                .filter(s -> s != null)
                .map(s -> s.getId())
                .orElse(null);
    }

    public String resolveSchoolName(Long adminUserId) {
        return adminRepository.findByUserId(adminUserId)
                .map(Admin::getSchool)
                .filter(s -> s != null)
                .map(s -> s.getSchoolName())
                .orElse(null);
    }
}
