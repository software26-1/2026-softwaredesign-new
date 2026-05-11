package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.domain.school.dto.SchoolCreateRequest;
import com.softwaredesign.schoolsystem.domain.school.dto.SchoolResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.SchoolUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SchoolService {

    private final SchoolRepository schoolRepository;

    public List<School> getSchools(SchoolType schoolType) {
        if (schoolType != null) {
            return schoolRepository.findAllBySchoolTypeAndIsDeletedFalse(schoolType);
        }
        return schoolRepository.findAllByIsDeletedIsFalse();
    }

    @Transactional
    public SchoolResponse createSchool(SchoolCreateRequest request) {
        School school = School.createSchool(request.getSchoolName(), request.getSchoolType(), request.getSchoolCode());
        schoolRepository.save(school);
        return SchoolResponse.from(school);
    }

    @Transactional
    public SchoolResponse updateSchool(Long schoolId, SchoolUpdateRequest request) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + schoolId));

        school.updateSchool(request.getSchoolName(), request.getSchoolType());
        return SchoolResponse.from(school);
    }

    @Transactional
    public void deleteSchool(Long schoolId) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다."));
        school.softDelete();
    }
}
