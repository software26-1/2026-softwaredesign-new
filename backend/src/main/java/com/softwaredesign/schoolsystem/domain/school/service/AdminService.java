package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.domain.school.dto.AdminResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.AdminUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.repository.AdminRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final AdminRepository adminRepository;
    private final SchoolRepository schoolRepository;

    public List<Admin> getAdmins(Long schoolId) {
        if (schoolId != null) {
            return adminRepository.findAllBySchoolIdAndIsDeletedFalse(schoolId);
        }
        return adminRepository.findAllByIsDeletedFalse();
    }

    public AdminResponse getAdmin(Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자를 찾을 수 없습니다. id=" + adminId));
        return AdminResponse.from(admin);
    }

    @Transactional
    public AdminResponse updateAdmin(Long adminId, AdminUpdateRequest request) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자를 찾을 수 없습니다. id=" + adminId));

        if (request.getSchoolId() != null) {
            School school = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + request.getSchoolId()));
            admin.assignSchool(school);
        }

        return AdminResponse.from(admin);
    }

    @Transactional
    public void deleteAdmin(Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자를 찾을 수 없습니다."));
        admin.softDelete();
    }
}
