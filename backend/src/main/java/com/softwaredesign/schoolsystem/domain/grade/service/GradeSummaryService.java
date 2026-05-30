package com.softwaredesign.schoolsystem.domain.grade.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeSummaryResponse;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeSummaryRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeSummaryService {

    private final GradeSummaryRepository gradeSummaryRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public List<GradeSummaryResponse> getByClassGroup(Long classGroupId, int year, int semester) {
        return gradeSummaryRepository.findByClassGroupIdAndYearAndSemester(classGroupId, year, semester)
                .stream().map(GradeSummaryResponse::from).toList();
    }

    public GradeSummaryResponse getByStudent(Long studentId, int year, int semester, AuthUser authUser) {
        validateAccess(studentId, authUser);
        return gradeSummaryRepository.findByStudentIdAndYearAndSemester(studentId, year, semester)
                .map(GradeSummaryResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("성적 요약 정보를 찾을 수 없습니다."));
    }

    private void validateAccess(Long studentId, AuthUser authUser) {
        String role = authUser.role();
        if ("STUDENT".equals(role)) {
            Long myStudentId = studentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .orElseThrow(() -> new AccessDeniedException("학생 정보를 찾을 수 없습니다."))
                    .getId();
            if (!myStudentId.equals(studentId)) {
                throw new AccessDeniedException("본인의 성적 요약만 조회할 수 있습니다.");
            }
        } else if ("PARENT".equals(role)) {
            parentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .map(parent -> parentStudentRepository.findAllByParentIdAndIsDeletedFalse(parent.getId()))
                    .filter(list -> list.stream().anyMatch(ps -> ps.getStudent().getId().equals(studentId)))
                    .orElseThrow(() -> new AccessDeniedException("자녀의 성적 요약만 조회할 수 있습니다."));
        }
    }
}
