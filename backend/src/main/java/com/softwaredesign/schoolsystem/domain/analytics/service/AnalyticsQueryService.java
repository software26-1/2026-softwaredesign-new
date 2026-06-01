package com.softwaredesign.schoolsystem.domain.analytics.service;

import com.softwaredesign.schoolsystem.domain.analytics.dto.*;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;
import com.softwaredesign.schoolsystem.domain.analytics.entity.DimCourse;
import com.softwaredesign.schoolsystem.domain.analytics.repository.DimCourseRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactClassCourseStatsRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentCourseTermRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentLearningSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsQueryService {

    private final FactStudentLearningSummaryRepository learningSummaryRepository;
    private final FactStudentCourseTermRepository courseTermRepository;
    private final FactClassCourseStatsRepository classCourseStatsRepository;
    private final DimCourseRepository dimCourseRepository;

    private Map<Long, String> courseNameMap() {
        return dimCourseRepository.findAll().stream()
                .filter(c -> c.getCourseName() != null)
                .collect(Collectors.toMap(DimCourse::getCourseKey, DimCourse::getCourseName, (a, b) -> a));
    }

    public LearningSummaryResponse getStudentSummary(Long studentId, Integer year, Integer semester) {
        return learningSummaryRepository.findByStudentKeyAndYearAndSemester(studentId, year, semester)
                .map(LearningSummaryResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("학습 요약 정보를 찾을 수 없습니다."));
    }

    public List<StudentCourseTermResponse> getStudentCourses(Long studentId, Integer year, Integer semester) {
        Map<Long, String> names = courseNameMap();
        return courseTermRepository.findByStudentKeyAndYearAndSemester(studentId, year, semester)
                .stream().map(e -> StudentCourseTermResponse.from(e, names.get(e.getCourseKey()))).toList();
    }

    public List<ScoreTrendPointResponse> getStudentTrend(Long studentId, Long courseId) {
        return courseTermRepository.findByStudentKeyAndCourseKeyOrderByYearAscSemesterAsc(studentId, courseId)
                .stream().map(ScoreTrendPointResponse::from).toList();
    }

    public List<ClassCourseStatsResponse> getClassCourses(Long classGroupId, Integer year, Integer semester) {
        return classCourseStatsRepository.findByClassGroupIdAndYearAndSemester(classGroupId, year, semester)
                .stream().map(ClassCourseStatsResponse::from).toList();
    }

    public List<LearningSummaryResponse> getAtRiskStudents(Integer year, Integer semester) {
        return learningSummaryRepository.findByYearAndSemesterAndRiskFlagTrue(year, semester)
                .stream().map(LearningSummaryResponse::from).toList();
    }

    /**
     * Score-bucket histogram for a course/term, computed in-service from the
     * student-course-term facts using avg_score buckets of width 10.
     */
    public List<ScoreDistributionResponse> getCourseDistribution(Long courseId, Integer year, Integer semester) {
        List<FactStudentCourseTerm> facts =
                courseTermRepository.findByCourseKeyAndYearAndSemester(courseId, year, semester);

        String[] labels = {"0-9", "10-19", "20-29", "30-39", "40-49",
                "50-59", "60-69", "70-79", "80-89", "90-100"};
        long[] counts = new long[labels.length];

        for (FactStudentCourseTerm f : facts) {
            BigDecimal score = f.getAvgScore();
            if (score == null) continue;
            int bucket = score.intValue() / 10;
            if (bucket < 0) bucket = 0;
            if (bucket > 9) bucket = 9; // scores of 100 fold into the top bucket
            counts[bucket]++;
        }

        List<ScoreDistributionResponse> result = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            result.add(new ScoreDistributionResponse(labels[i], counts[i]));
        }
        return result;
    }
}
