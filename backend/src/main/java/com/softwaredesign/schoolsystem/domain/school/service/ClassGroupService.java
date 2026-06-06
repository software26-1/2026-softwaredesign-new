package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupCreateRequest;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.ClassGroupUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
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
    private final TeacherRepository teacherRepository;

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

    @Transactional
    public ClassGroupResponse assignHomeroomTeacher(Long classGroupId, Long teacherId) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        if (teacherId == null) {
            classGroup.assignHomeroomTeacher(null);
        } else {
            Teacher teacher = teacherRepository.findById(teacherId)
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classGroup.assignHomeroomTeacher(teacher);
        }
        return ClassGroupResponse.from(classGroup);
    }

}
