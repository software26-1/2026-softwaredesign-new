package com.softwaredesign.schoolsystem.domain.grade.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeSummaryResponse;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeSummaryRepository;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
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
    private final StudentAccessGuard studentAccessGuard;

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
        // 학생/학부모는 본인·자녀만, 교사는 같은 학교 학생만(학교 격리), 관리자는 허용
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
    }
}
