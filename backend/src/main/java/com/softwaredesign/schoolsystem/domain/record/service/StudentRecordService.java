package com.softwaredesign.schoolsystem.domain.record.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordCreateOrUpdateRequest;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordResponse;
import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import com.softwaredesign.schoolsystem.domain.record.repository.StudentRecordRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentRecordService {

    private final StudentRecordRepository studentRecordRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public StudentRecordResponse getByStudent(Long studentId, AuthUser authUser) {
        studentId = resolveStudentId(studentId, authUser);
        StudentRecord record = studentRecordRepository.findByStudentId(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생부를 찾을 수 없습니다."));
        return StudentRecordResponse.from(record);
    }

    @Transactional
    public StudentRecordResponse upsert(Long studentId, StudentRecordCreateOrUpdateRequest request, Long userId) {
        teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));

        StudentRecord record = studentRecordRepository.findByStudentId(studentId)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId)
                            .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
                    return studentRecordRepository.save(StudentRecord.createStudentRecord(student));
                });

        record.updateStudentRecord(request.getAchievements(), request.getExtracurricular(),
                request.getVolunteerHours(), request.getCareerAspirations());
        return StudentRecordResponse.from(record);
    }

    private Long resolveStudentId(Long requestedStudentId, AuthUser authUser) {
        String role = authUser.role();
        if ("STUDENT".equals(role)) {
            return studentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .orElseThrow(() -> new AccessDeniedException("학생 정보를 찾을 수 없습니다."))
                    .getId();
        }
        if ("PARENT".equals(role)) {
            Long targetStudentId = requestedStudentId;
            parentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .map(parent -> parentStudentRepository.findAllByParentIdAndIsDeletedFalse(parent.getId()))
                    .filter(list -> list.stream().anyMatch(ps -> ps.getStudent().getId().equals(targetStudentId)))
                    .orElseThrow(() -> new AccessDeniedException("자녀의 학생부만 조회할 수 있습니다."));
            return requestedStudentId;
        }
        return requestedStudentId;
    }
}
