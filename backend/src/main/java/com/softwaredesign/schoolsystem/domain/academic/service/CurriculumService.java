package com.softwaredesign.schoolsystem.domain.academic.service;

import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.academic.repository.CurriculumRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;

    public List<Curriculum> getCurriculums(SchoolType schoolType) {
        if (schoolType != null) {
            return curriculumRepository.findAllBySchoolTypeAndIsDeletedFalse(schoolType);
        }
        return curriculumRepository.findAllByIsDeletedIsFalse();
    }

    @Transactional
    public CurriculumResponse createCurriculum(CurriculumCreateRequest request) {
        Curriculum curriculum = Curriculum.createCurriculum(request.getCurriculumName(), request.getSchoolType());
        curriculumRepository.save(curriculum);
        return CurriculumResponse.from(curriculum);
    }

    @Transactional
    public CurriculumResponse updateCurriculum(Long curriculumId, CurriculumUpdateRequest request) {
        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new IllegalArgumentException("교과를 찾을 수 없습니다. id=" + curriculumId));

        curriculum.updateCurriculum(request.getCurriculumName(), request.getSchoolType());
        return CurriculumResponse.from(curriculum);
    }

    @Transactional
    public void deleteCurriculum(Long curriculumId) {
        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new IllegalArgumentException("교과를 찾을 수 없습니다."));
        curriculum.softDelete();
    }
}
