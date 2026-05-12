package com.softwaredesign.schoolsystem.domain.student.service;

import com.softwaredesign.schoolsystem.domain.student.dto.ParentOfStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.ParentStudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentOfParentResponse;
import com.softwaredesign.schoolsystem.domain.student.entity.Parent;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParentStudentService {

    private final ParentStudentRepository parentStudentRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;

    public List<ParentOfStudentResponse> getParentsByStudent(Long studentId) {
        List<ParentStudent> mappings = parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(studentId);
        return mappings.stream()
                .map(ParentOfStudentResponse::from)
                .toList();
    }

    public List<StudentOfParentResponse> getStudentsByParent(Long parentId) {
        List<ParentStudent> mappings = parentStudentRepository.findAllByParentIdAndIsDeletedFalse(parentId);
        return mappings.stream()
                .map(StudentOfParentResponse::from)
                .toList();
    }

    @Transactional
    public ParentStudentResponse createMapping(ParentStudentCreateRequest request) {
        Parent parent = parentRepository.findById(request.getParentId())
                .orElseThrow(() -> new IllegalArgumentException("학부모를 찾을 수 없습니다. id=" + request.getParentId()));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. id=" + request.getStudentId()));

        ParentStudent parentStudent = ParentStudent.createParentStudent(student, parent, request.getRelationship());
        parentStudentRepository.save(parentStudent);
        return ParentStudentResponse.from(parentStudent);
    }

    @Transactional
    public void deleteMapping(Long mappingId) {
        ParentStudent parentStudent = parentStudentRepository.findById(mappingId)
                .orElseThrow(() -> new IllegalArgumentException("매핑을 찾을 수 없습니다."));
        parentStudent.softDelete();
    }
}
