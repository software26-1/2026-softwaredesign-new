package com.softwaredesign.schoolsystem.domain.school.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * 역할별 "이 계정이 이 학생/학급의 정보에 접근할 권한이 있는가"를 한 곳에서 판단한다.
 *
 * <ul>
 *   <li>ADMIN  : 허용</li>
 *   <li>TEACHER: 대상 학생/학급이 <b>본인과 같은 학교</b>여야 한다 (타 학교 차단)</li>
 *   <li>STUDENT: 본인 학생 레코드일 때만</li>
 *   <li>PARENT : 본인 자녀(parent_student)일 때만</li>
 * </ul>
 *
 * 조회/분석 경로처럼 별도 권한 검증이 없던 지점에 공통으로 적용한다.
 */
@Component
@RequiredArgsConstructor
public class StudentAccessGuard {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ClassGroupRepository classGroupRepository;

    /** 인증 계정이 해당 학생 정보에 접근 가능한지 검증. 불가 시 AccessDeniedException. */
    public void requireCanAccessStudent(AuthUser authUser, Long studentId) {
        if (studentId == null) {
            throw new AccessDeniedException("대상 학생이 지정되지 않았습니다.");
        }
        switch (authUser.role()) {
            case "ADMIN" -> {
                // 관리자: 전체 허용 (학교 단위 제어는 별도 Admin 엔드포인트에서)
            }
            case "TEACHER" -> {
                Long teacherSchoolId = teacherSchoolId(authUser.id());
                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new AccessDeniedException("학생을 찾을 수 없습니다."));
                Long studentSchoolId = student.getSchool() != null ? student.getSchool().getId() : null;
                if (teacherSchoolId == null || studentSchoolId == null
                        || !teacherSchoolId.equals(studentSchoolId)) {
                    throw new AccessDeniedException("같은 학교 학생만 접근할 수 있습니다.");
                }
            }
            case "STUDENT" -> {
                Long selfStudentId = studentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                        .map(Student::getId)
                        .orElseThrow(() -> new AccessDeniedException("학생 정보를 찾을 수 없습니다."));
                if (!selfStudentId.equals(studentId)) {
                    throw new AccessDeniedException("본인의 정보만 조회할 수 있습니다.");
                }
            }
            case "PARENT" -> {
                boolean isMyChild = parentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                        .map(parent -> parentStudentRepository.findAllByParentIdAndIsDeletedFalse(parent.getId()))
                        .map(links -> links.stream().anyMatch(ps -> ps.getStudent().getId().equals(studentId)))
                        .orElse(false);
                if (!isMyChild) {
                    throw new AccessDeniedException("자녀의 정보만 조회할 수 있습니다.");
                }
            }
            default -> throw new AccessDeniedException("접근 권한이 없습니다.");
        }
    }

    /** 교사가 해당 학급과 같은 학교인지 검증 (학급 단위 분석/통계용). ADMIN은 허용. */
    public void requireCanAccessClass(AuthUser authUser, Long classGroupId) {
        if ("ADMIN".equals(authUser.role())) {
            return;
        }
        if (!"TEACHER".equals(authUser.role())) {
            throw new AccessDeniedException("접근 권한이 없습니다.");
        }
        if (classGroupId == null) {
            throw new AccessDeniedException("대상 학급이 지정되지 않았습니다.");
        }
        Long teacherSchoolId = teacherSchoolId(authUser.id());
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new AccessDeniedException("학급을 찾을 수 없습니다."));
        Long classSchoolId = classGroup.getSchool() != null ? classGroup.getSchool().getId() : null;
        if (teacherSchoolId == null || classSchoolId == null || !teacherSchoolId.equals(classSchoolId)) {
            throw new AccessDeniedException("같은 학교 학급만 접근할 수 있습니다.");
        }
    }

    private Long teacherSchoolId(Long userId) {
        return teacherRepository.findByUserId(userId)
                .map(t -> t.getSchool() != null ? t.getSchool().getId() : null)
                .orElseThrow(() -> new AccessDeniedException("교사 정보를 찾을 수 없습니다."));
    }
}
