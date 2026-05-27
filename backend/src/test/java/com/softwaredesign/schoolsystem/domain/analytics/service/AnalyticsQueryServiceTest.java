package com.softwaredesign.schoolsystem.domain.analytics.service;

import com.softwaredesign.schoolsystem.domain.analytics.dto.ClassCourseStatsResponse;
import com.softwaredesign.schoolsystem.domain.analytics.dto.LearningSummaryResponse;
import com.softwaredesign.schoolsystem.domain.analytics.dto.ScoreDistributionResponse;
import com.softwaredesign.schoolsystem.domain.analytics.dto.ScoreTrendPointResponse;
import com.softwaredesign.schoolsystem.domain.analytics.dto.StudentCourseTermResponse;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactClassCourseStats;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentLearningSummary;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactClassCourseStatsRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentCourseTermRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentLearningSummaryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsQueryService 단위 테스트")
class AnalyticsQueryServiceTest {

    @Mock
    private FactStudentLearningSummaryRepository learningSummaryRepository;
    @Mock
    private FactStudentCourseTermRepository courseTermRepository;
    @Mock
    private FactClassCourseStatsRepository classCourseStatsRepository;

    @InjectMocks
    private AnalyticsQueryService analyticsQueryService;

    private FactStudentCourseTerm courseTermWithScore(BigDecimal avgScore) {
        FactStudentCourseTerm fact = mock(FactStudentCourseTerm.class);
        lenient().when(fact.getAvgScore()).thenReturn(avgScore);
        lenient().when(fact.getStudentKey()).thenReturn(100L);
        lenient().when(fact.getCourseKey()).thenReturn(7L);
        lenient().when(fact.getYear()).thenReturn(2026);
        lenient().when(fact.getSemester()).thenReturn(1);
        return fact;
    }

    @Test
    @DisplayName("학습 요약을 DTO 로 매핑해 반환한다")
    void getStudentSummary_success() {
        FactStudentLearningSummary summary = mock(FactStudentLearningSummary.class);
        given(summary.getStudentKey()).willReturn(100L);
        given(summary.getOverallAvgScore()).willReturn(new BigDecimal("88.5"));
        given(summary.getRiskFlag()).willReturn(false);
        given(learningSummaryRepository.findByStudentKeyAndYearAndSemester(100L, 2026, 1))
                .willReturn(Optional.of(summary));

        LearningSummaryResponse response = analyticsQueryService.getStudentSummary(100L, 2026, 1);

        assertThat(response.studentKey()).isEqualTo(100L);
        assertThat(response.overallAvgScore()).isEqualByComparingTo("88.5");
    }

    @Test
    @DisplayName("학습 요약이 없으면 IllegalArgumentException 발생")
    void getStudentSummary_notFound() {
        given(learningSummaryRepository.findByStudentKeyAndYearAndSemester(100L, 2026, 1))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsQueryService.getStudentSummary(100L, 2026, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학습 요약");
    }

    @Test
    @DisplayName("학생별 과목 요약 목록을 매핑해 반환한다")
    void getStudentCourses_success() {
        FactStudentCourseTerm fact = courseTermWithScore(new BigDecimal("80"));
        given(courseTermRepository.findByStudentKeyAndYearAndSemester(100L, 2026, 1))
                .willReturn(List.of(fact));

        List<StudentCourseTermResponse> result = analyticsQueryService.getStudentCourses(100L, 2026, 1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).studentKey()).isEqualTo(100L);
    }

    @Test
    @DisplayName("학생 점수 추이를 시간순으로 반환한다")
    void getStudentTrend_success() {
        FactStudentCourseTerm fact = courseTermWithScore(new BigDecimal("75"));
        given(courseTermRepository.findByStudentKeyAndCourseKeyOrderByYearAscSemesterAsc(100L, 7L))
                .willReturn(List.of(fact));

        List<ScoreTrendPointResponse> result = analyticsQueryService.getStudentTrend(100L, 7L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).avgScore()).isEqualByComparingTo("75");
    }

    @Test
    @DisplayName("반별 과목 통계를 매핑해 반환한다")
    void getClassCourses_success() {
        FactClassCourseStats stats = mock(FactClassCourseStats.class);
        given(stats.getClassGroupId()).willReturn(5L);
        given(stats.getCourseKey()).willReturn(7L);
        given(classCourseStatsRepository.findByClassGroupIdAndYearAndSemester(5L, 2026, 1))
                .willReturn(List.of(stats));

        List<ClassCourseStatsResponse> result = analyticsQueryService.getClassCourses(5L, 2026, 1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).classGroupId()).isEqualTo(5L);
    }

    @Test
    @DisplayName("위험군 학생 목록을 매핑해 반환한다")
    void getAtRiskStudents_success() {
        FactStudentLearningSummary summary = mock(FactStudentLearningSummary.class);
        given(summary.getStudentKey()).willReturn(100L);
        given(summary.getRiskFlag()).willReturn(true);
        given(learningSummaryRepository.findByYearAndSemesterAndRiskFlagTrue(2026, 1))
                .willReturn(List.of(summary));

        List<LearningSummaryResponse> result = analyticsQueryService.getAtRiskStudents(2026, 1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).riskFlag()).isTrue();
    }

    @Test
    @DisplayName("점수 분포는 10단위 10개 버킷으로 집계하고 100점은 최상위 버킷에 들어간다")
    void getCourseDistribution_buckets() {
        FactStudentCourseTerm low = courseTermWithScore(new BigDecimal("5"));      // 0-9
        FactStudentCourseTerm high = courseTermWithScore(new BigDecimal("95"));    // 90-100
        FactStudentCourseTerm top = courseTermWithScore(new BigDecimal("100"));    // 90-100 (folded)
        FactStudentCourseTerm none = courseTermWithScore(null);                    // skipped
        given(courseTermRepository.findByCourseKeyAndYearAndSemester(7L, 2026, 1))
                .willReturn(List.of(low, high, top, none));

        List<ScoreDistributionResponse> result =
                analyticsQueryService.getCourseDistribution(7L, 2026, 1);

        assertThat(result).hasSize(10);
        assertThat(result.get(0).bucket()).isEqualTo("0-9");
        assertThat(result.get(0).count()).isEqualTo(1);
        assertThat(result.get(9).bucket()).isEqualTo("90-100");
        assertThat(result.get(9).count()).isEqualTo(2);
        long total = result.stream().mapToLong(ScoreDistributionResponse::count).sum();
        assertThat(total).isEqualTo(3); // null skipped
    }

    @Test
    @DisplayName("점수 분포 대상이 없으면 모든 버킷의 count 가 0 이다")
    void getCourseDistribution_empty() {
        given(courseTermRepository.findByCourseKeyAndYearAndSemester(7L, 2026, 1)).willReturn(List.of());

        List<ScoreDistributionResponse> result =
                analyticsQueryService.getCourseDistribution(7L, 2026, 1);

        assertThat(result).hasSize(10);
        assertThat(result.stream().mapToLong(ScoreDistributionResponse::count).sum()).isZero();
    }
}
