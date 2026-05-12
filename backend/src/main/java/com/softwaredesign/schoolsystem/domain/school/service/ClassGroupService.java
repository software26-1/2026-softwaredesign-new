package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupCreateRequest;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassGroupService {

    private final ClassGroupRepository classGroupRepository;
    private final SchoolRepository schoolRepository;

    public List<ClassGroup> getClassGroups(Long schoolId, Integer academicYear, Integer grade) {
        if (academicYear != null && grade != null) {
            return classGroupRepository.findAllBySchoolIdAndAcademicYearAndGradeAndIsDeletedFalse(schoolId, academicYear, grade);
        }
        if (academicYear != null) {
            return classGroupRepository.findAllBySchoolIdAndAcademicYearAndIsDeletedFalse(schoolId, academicYear);
        }
        if (grade != null) {
            return classGroupRepository.findAllBySchoolIdAndGradeAndIsDeletedFalse(schoolId, grade);
        }
        return classGroupRepository.findAllBySchoolIdAndIsDeletedFalse(schoolId);
    }

    @Transactional
    public ClassGroupResponse createClassGroup(Long schoolId, ClassGroupCreateRequest request) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + schoolId));

        ClassGroup classGroup = ClassGroup.createClassGroup(
                school, request.getGrade(), request.getClassNumber(), request.getAcademicYear());
        classGroupRepository.save(classGroup);
        return ClassGroupResponse.from(classGroup);
    }

    @Transactional
    public ClassGroupResponse updateClassGroup(Long classGroupId, ClassGroupUpdateRequest request) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. id=" + classGroupId));

        classGroup.updateClassGroup(request.getGrade(), request.getClassNumber());
        return ClassGroupResponse.from(classGroup);
    }

    @Transactional
    public void deleteClassGroup(Long classGroupId) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        classGroup.softDelete();
    }

}
