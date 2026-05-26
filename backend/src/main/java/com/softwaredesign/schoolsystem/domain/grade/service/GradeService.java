package com.softwaredesign.schoolsystem.domain.grade.service;

import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeCreateRequest;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeResponse;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeUpdateRequest;
import com.softwaredesign.schoolsystem.domain.grade.entity.Grade;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeService {

    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    @Transactional
    public GradeResponse createGrade(GradeCreateRequest request, Long userId) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new IllegalArgumentException("수강 정보를 찾을 수 없습니다."));

        validateTeacherPermission(enrollment, userId);

        Grade grade = Grade.createGrade(student, enrollment, request.getScore(), request.getGradeType());
        gradeRepository.save(grade);
        return GradeResponse.from(grade);
    }

    public List<GradeResponse> getGradesByStudent(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(GradeResponse::from)
                .toList();
    }

    public List<GradeResponse> getGradesByEnrollment(Long enrollmentId) {
        return gradeRepository.findByEnrollmentId(enrollmentId).stream()
                .map(GradeResponse::from)
                .toList();
    }

    @Transactional
    public GradeResponse updateGrade(Long gradeId, GradeUpdateRequest request, Long userId) {
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));

        validateTeacherPermission(grade.getEnrollment(), userId);

        grade.updateGrade(request.getScore(), request.getGradeType());
        return GradeResponse.from(grade);
    }

    @Transactional
    public void deleteGrade(Long gradeId, Long userId) {
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));

        validateTeacherPermission(grade.getEnrollment(), userId);

        gradeRepository.delete(grade);
    }

    // 해당 수강의 담당 교사인지 검증
    private void validateTeacherPermission(Enrollment enrollment, Long userId) {
        Long teacherUserId = enrollment.getCourse().getTeacher().getUser().getId();
        if (!teacherUserId.equals(userId)) {
            throw new AccessDeniedException("해당 과목 담당 교사만 성적을 관리할 수 있습니다.");
        }
    }
}
