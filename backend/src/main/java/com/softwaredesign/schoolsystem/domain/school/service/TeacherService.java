package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.domain.school.dto.TeacherResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.TeacherUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;

    public List<Teacher> getTeachers(Long schoolId) {
        if (schoolId != null) {
            return teacherRepository.findAllBySchoolIdAndIsDeletedFalse(schoolId);
        }
        return teacherRepository.findAllByIsDeletedFalse();
    }

    public TeacherResponse getTeacher(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. id=" + teacherId));
        return TeacherResponse.from(teacher);
    }

    @Transactional
    public TeacherResponse updateTeacher(Long teacherId, TeacherUpdateRequest request) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. id=" + teacherId));

        if (request.getSchoolId() != null) {
            School school = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + request.getSchoolId()));
            teacher.assignSchool(school);
        }

        if (request.getPosition() != null) {
            teacher.updatePosition(request.getPosition());
        }

        return TeacherResponse.from(teacher);
    }

    @Transactional
    public void deleteTeacher(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        teacher.softDelete();
    }
}
