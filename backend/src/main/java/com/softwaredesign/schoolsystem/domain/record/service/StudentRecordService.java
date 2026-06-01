package com.softwaredesign.schoolsystem.domain.record.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordCreateOrUpdateRequest;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordResponse;
import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.record.repository.StudentRecordRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
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
    private final ClassGroupRepository classGroupRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final EnrollmentRepository enrollmentRepository;

    public StudentRecordResponse getByStudent(Long studentId, AuthUser authUser) {
        studentId = resolveStudentId(studentId, authUser);
        return studentRecordRepository.findByStudentId(studentId)
                .map(StudentRecordResponse::from)
                .orElse(null);
    }

    @Transactional
    public StudentRecordResponse upsert(Long studentId, StudentRecordCreateOrUpdateRequest request, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        Student targetStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 담임(본인 반) 또는 해당 학생이 수강하는 교과의 담당 교사만 학생부 작성/수정 가능
        boolean isHomeroom = classGroupRepository.findByHomeroomTeacherIdAndIsDeletedFalse(teacher.getId())
                .map(cg -> targetStudent.getClassGroup() != null
                        && targetStudent.getClassGroup().getId().equals(cg.getId()))
                .orElse(false);
        boolean isSubjectTeacher = enrollmentRepository
                .existsByStudentIdAndCourse_Teacher_IdAndIsDeletedFalse(studentId, teacher.getId());
        if (!isHomeroom && !isSubjectTeacher) {
            throw new AccessDeniedException("담임 또는 해당 학생을 가르치는 교과 교사만 학생부를 작성할 수 있습니다.");
        }

        StudentRecord record = studentRecordRepository.findByStudentId(studentId)
                .orElseGet(() -> studentRecordRepository.save(StudentRecord.createStudentRecord(targetStudent)));

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
