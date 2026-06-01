package com.softwaredesign.schoolsystem.domain.student.service;

import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentCreateRequest;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentResponse;
import com.softwaredesign.schoolsystem.domain.student.dto.StudentUpdateRequest;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final ClassGroupRepository classGroupRepository;

    @Transactional
    public StudentResponse createStudent(StudentCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + request.getUserId()));

        School school = schoolRepository.findById(request.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다. id=" + request.getSchoolId()));

        ClassGroup classGroup = classGroupRepository.findById(request.getClassGroupId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. id=" + request.getClassGroupId()));

        Student student = Student.createStudent(user, school, classGroup, request.getStudentNumber());
        studentRepository.save(student);
        return StudentResponse.from(student);
    }

    public List<Student> getStudents(Long schoolId, Long classGroupId, Integer grade, Integer classNumber, String name) {
        if (classGroupId != null) {
            return schoolId != null
                    ? studentRepository.findAllBySchoolIdAndClassGroupIdAndIsDeletedFalse(schoolId, classGroupId)
                    : studentRepository.findAllByClassGroupIdAndIsDeletedFalse(classGroupId);
        }
        if (grade != null || classNumber != null || (name != null && !name.isBlank())) {
            return studentRepository.searchStudents(schoolId, grade, classNumber, name != null && !name.isBlank() ? name : null);
        }
        return schoolId != null
                ? studentRepository.findAllBySchoolIdAndIsDeletedFalse(schoolId)
                : studentRepository.findAllByIsDeletedFalse();
    }

    public List<StudentResponse> getUnassignedStudents(Long schoolId) {
        return studentRepository.findAllBySchoolIdAndClassGroupIsNullAndIsDeletedFalse(schoolId)
                .stream().map(StudentResponse::from).toList();
    }

    @Transactional
    public StudentResponse assignClassGroup(Long studentId, Long classGroupId, Integer studentNumber) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        student.updateStudent(classGroup, studentNumber);
        return StudentResponse.from(student);
    }

    public StudentResponse getStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. id=" + studentId));
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse updateStudent(Long studentId, StudentUpdateRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. id=" + studentId));

        ClassGroup classGroup = null;
        if (request.getClassGroupId() != null) {
            classGroup = classGroupRepository.findById(request.getClassGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. id=" + request.getClassGroupId()));
        }

        student.updateStudent(classGroup, request.getStudentNumber());
        return StudentResponse.from(student);
    }

    @Transactional
    public void deleteStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        student.softDelete();
    }
}
