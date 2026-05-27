package com.softwaredesign.schoolsystem.domain.analytics.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentCourseTerm;
import com.softwaredesign.schoolsystem.domain.analytics.entity.FactStudentLearningSummary;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentCourseTermRepository;
import com.softwaredesign.schoolsystem.domain.analytics.repository.FactStudentLearningSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * AI chatbot grounded in a student's analytics facts. Builds a Korean system
 * prompt from the most recent learning summary + course-term rows and asks the
 * Claude API to answer using only that data.
 *
 * <p>If {@code ANTHROPIC_API_KEY} is unset/blank the service returns a graceful
 * fallback message instead of throwing, so the endpoint stays usable without an
 * API key configured.
 */
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final String MODEL = "claude-haiku-4-5";
    private static final int MAX_TOKENS = 1024;
    private static final String NOT_CONFIGURED =
            "AI 챗봇이 구성되지 않았습니다 (ANTHROPIC_API_KEY 미설정)";

    @Value("${ANTHROPIC_API_KEY:}")
    private String apiKey;

    private final FactStudentLearningSummaryRepository learningSummaryRepository;
    private final FactStudentCourseTermRepository courseTermRepository;
    // 내부에서 직접 생성 (RestClient.Builder 빈에 의존하지 않음 → 빈 부재로 인한 기동 실패 방지)
    private final RestClient restClient = RestClient.create();

    @Transactional(readOnly = true)
    public String chat(Long studentId, String question) {
        if (apiKey == null || apiKey.isBlank()) {
            return NOT_CONFIGURED;
        }

        String systemPrompt = buildSystemPrompt(studentId);

        try {
            JsonNode body = restClient
                    .post()
                    .uri(ANTHROPIC_URL)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .header("content-type", "application/json")
                    .body(Map.of(
                            "model", MODEL,
                            "max_tokens", MAX_TOKENS,
                            "system", systemPrompt,
                            "messages", List.of(Map.of("role", "user", "content", question))))
                    .retrieve()
                    .body(JsonNode.class);

            if (body != null && body.has("content") && body.get("content").isArray()
                    && !body.get("content").isEmpty()) {
                JsonNode text = body.get("content").get(0).get("text");
                if (text != null) {
                    return text.asText();
                }
            }
            return "AI 응답을 해석하지 못했습니다.";
        } catch (RuntimeException ex) {
            return "AI 챗봇 호출 중 오류가 발생했습니다: " + ex.getMessage();
        }
    }

    /**
     * Builds the Korean system prompt from the student's most recent term facts.
     */
    private String buildSystemPrompt(Long studentId) {
        Optional<FactStudentLearningSummary> latest =
                learningSummaryRepository.findByStudentKey(studentId).stream()
                        .max(Comparator
                                .comparing(FactStudentLearningSummary::getYear,
                                        Comparator.nullsFirst(Comparator.naturalOrder()))
                                .thenComparing(FactStudentLearningSummary::getSemester,
                                        Comparator.nullsFirst(Comparator.naturalOrder())));

        StringBuilder sb = new StringBuilder();
        sb.append("당신은 학교 학습 분석 도우미입니다. 아래 데이터에만 근거해 한국어로 답하세요. ")
          .append("데이터에 없는 내용은 추측하지 말고 모른다고 답하세요.\n\n");

        if (latest.isEmpty()) {
            sb.append("학생 학습 요약: 분석 데이터가 없습니다.");
            return sb.toString();
        }

        FactStudentLearningSummary s = latest.get();
        sb.append("학생 학습 요약 (").append(s.getYear()).append("년 ")
          .append(s.getSemester()).append("학기):\n");
        sb.append("- 전체 평균 점수: ").append(nz(s.getOverallAvgScore())).append("\n");
        sb.append("- 석차: ").append(nz(s.getOverallClassRank())).append("\n");
        sb.append("- 출석률: ").append(nz(s.getAttendanceRate())).append("%\n");
        sb.append("- 결석 ").append(nz(s.getAbsentCount()))
          .append("회, 지각 ").append(nz(s.getLateCount()))
          .append("회, 조퇴 ").append(nz(s.getEarlyLeaveCount())).append("회\n");
        sb.append("- 피드백 총 ").append(nz(s.getFeedbackTotal()))
          .append("건 (긍정 ").append(nz(s.getPositiveFeedback()))
          .append(", 부정 ").append(nz(s.getNegativeFeedback())).append(")\n");
        sb.append("- 상담 횟수: ").append(nz(s.getCounselingCount())).append("\n");
        sb.append("- 성적 추세: ").append(nz(s.getScoreTrend())).append("\n");
        sb.append("- 위험 플래그: ").append(nz(s.getRiskFlag())).append("\n\n");

        List<FactStudentCourseTerm> courses = courseTermRepository
                .findByStudentKeyAndYearAndSemester(studentId, s.getYear(), s.getSemester());
        if (!courses.isEmpty()) {
            sb.append("과목별 성적:\n");
            for (FactStudentCourseTerm c : courses) {
                sb.append("- 과목ID ").append(c.getCourseKey())
                  .append(": 평균 ").append(nz(c.getAvgScore()))
                  .append(", 중간 ").append(nz(c.getMidtermScore()))
                  .append(", 기말 ").append(nz(c.getFinalScore()))
                  .append(", 수행 ").append(nz(c.getTaskScore()))
                  .append("\n");
            }
        }
        return sb.toString();
    }

    private static String nz(Object value) {
        return value == null ? "데이터 없음" : value.toString();
    }
}
