package com.softwaredesign.schoolsystem.domain.grade.service;

import com.softwaredesign.schoolsystem.domain.grade.dto.GradeSummaryResponse;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeSummaryService {

    private final GradeSummaryRepository gradeSummaryRepository;

    public List<GradeSummaryResponse> getByClassGroup(Long classGroupId, int year, int semester) {
        return gradeSummaryRepository.findByClassGroupIdAndYearAndSemester(classGroupId, year, semester)
                .stream().map(GradeSummaryResponse::from).toList();
    }

    public GradeSummaryResponse getByStudent(Long studentId, int year, int semester) {
        return gradeSummaryRepository.findByStudentIdAndYearAndSemester(studentId, year, semester)
                .map(GradeSummaryResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("성적 요약 정보를 찾을 수 없습니다."));
    }
}
