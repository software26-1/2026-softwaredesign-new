package com.softwaredesign.schoolsystem.domain.analytics.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto.ChatMessage;
import com.softwaredesign.schoolsystem.domain.analytics.entity.*;
import com.softwaredesign.schoolsystem.domain.analytics.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent";
    private static final int MAX_TOKENS = 1024;
    private static final int MAX_HISTORY = 20;
    private static final int MAX_RETRIES = 2;
    private static final String NOT_CONFIGURED = "AI 챗봇이 구성되지 않았습니다 (GEMINI_API_KEY 미설정)";

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    private final FactStudentLearningSummaryRepository learningSummaryRepository;
    private final FactStudentCourseTermRepository courseTermRepository;
    private final DimCourseRepository dimCourseRepository;
    private final DimStudentRepository dimStudentRepository;
    private final FactClassCourseStatsRepository classStatsRepository;
    // 직접 생성 (RestClient.Builder 빈 없이도 기동 가능)
    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public String chat(Long studentId, String question, List<ChatMessage> history, String role) {
        if (apiKey == null || apiKey.isBlank()) {
            return NOT_CONFIGURED;
        }

        String systemPrompt = buildSystemPrompt(studentId, role);
        List<Map<String, Object>> contents = buildContents(history, question);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))));
        requestBody.put("contents", contents);
        requestBody.put("generationConfig", Map.of("maxOutputTokens", MAX_TOKENS));

        Exception lastEx = null;
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                String responseBody = restClient
                        .post()
                        .uri(GEMINI_URL + "?key=" + apiKey)
                        .header("content-type", "application/json")
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

                JsonNode body = objectMapper.readTree(responseBody);
                if (body != null && body.has("candidates") && body.get("candidates").isArray()
                        && !body.get("candidates").isEmpty()) {
                    JsonNode text = body.get("candidates").get(0)
                            .path("content").path("parts").get(0).path("text");
                    if (!text.isMissingNode()) return text.asText();
                }
                return "AI 응답을 해석하지 못했습니다.";
            } catch (Exception ex) {
                lastEx = ex;
                if (attempt < MAX_RETRIES) {
                    try { Thread.sleep(1000L * (attempt + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                }
            }
        }
        return "AI 챗봇 호출 중 오류가 발생했습니다: " + (lastEx != null ? lastEx.getMessage() : "알 수 없는 오류");
    }

    // Gemini uses "user"/"model" roles and "parts" array format
    private List<Map<String, Object>> buildContents(List<ChatMessage> history, String question) {
        List<Map<String, Object>> contents = new ArrayList<>();
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - MAX_HISTORY);
            history.subList(start, history.size()).forEach(h -> {
                String geminiRole = "assistant".equals(h.role()) ? "model" : "user";
                contents.add(Map.of(
                        "role", geminiRole,
                        "parts", List.of(Map.of("text", h.content()))));
            });
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", question))));
        return contents;
    }

    private String buildSystemPrompt(Long studentId, String role) {
        boolean isStaff = "TEACHER".equals(role) || "ADMIN".equals(role);

        DimStudent dimStudent = dimStudentRepository.findById(studentId).orElse(null);
        String studentName = dimStudent != null ? nz(dimStudent.getStudentName()) : "알 수 없음";
        String classInfo = dimStudent != null
                ? dimStudent.getGradeLevel() + "학년 " + nz(dimStudent.getClassName())
                : "미배정";

        Optional<FactStudentLearningSummary> latestOpt =
                learningSummaryRepository.findByStudentKey(studentId).stream()
                        .max(Comparator
                                .comparing(FactStudentLearningSummary::getYear,
                                        Comparator.nullsFirst(Comparator.naturalOrder()))
                                .thenComparing(FactStudentLearningSummary::getSemester,
                                        Comparator.nullsFirst(Comparator.naturalOrder())));

        StringBuilder sb = new StringBuilder();
        appendRoleInstructions(sb, role);

        appendSection(sb, "학생 기본 정보");
        sb.append("이름: ").append(studentName)
          .append(" | 학년/반: ").append(classInfo).append("\n");

        if (latestOpt.isEmpty()) {
            sb.append("\n분석 데이터가 없습니다. ETL을 실행한 후 다시 시도하세요.\n");
            return sb.toString();
        }

        FactStudentLearningSummary s = latestOpt.get();

        List<FactStudentCourseTerm> courses = courseTermRepository
                .findByStudentKeyAndYearAndSemester(studentId, s.getYear(), s.getSemester());

        // 과목명 일괄 조회
        Set<Long> courseKeys = courses.stream()
                .map(FactStudentCourseTerm::getCourseKey)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> courseNameMap = dimCourseRepository.findAllById(courseKeys).stream()
                .collect(Collectors.toMap(
                        DimCourse::getCourseKey,
                        dc -> dc.getCourseName() != null ? dc.getCourseName() : "과목" + dc.getCourseKey()
                ));

        // 반 통계 (교사/관리자만, classGroupId 있을 때)
        Map<Long, FactClassCourseStats> classStatsMap = Collections.emptyMap();
        if (isStaff && dimStudent != null && dimStudent.getClassGroupId() != null) {
            classStatsMap = classStatsRepository
                    .findByClassGroupIdAndYearAndSemester(
                            dimStudent.getClassGroupId(), s.getYear(), s.getSemester())
                    .stream()
                    .collect(Collectors.toMap(
                            FactClassCourseStats::getCourseKey, Function.identity(), (a, b) -> a));
        }

        // 과목별 성적
        appendSection(sb, s.getYear() + "년 " + s.getSemester() + "학기 과목별 성적");
        if (courses.isEmpty()) {
            sb.append("과목 데이터 없음\n");
        } else {
            if (isStaff) {
                sb.append(String.format("%-12s %7s %7s %7s %7s %6s %6s %6s%n",
                        "과목", "내점수", "반평균", "반최고", "반최저", "인원", "석차", "등급"));
            } else {
                sb.append(String.format("%-12s %7s %7s %6s %6s%n",
                        "과목", "내점수", "반평균", "석차", "등급"));
            }
            for (FactStudentCourseTerm c : courses) {
                String name = courseNameMap.getOrDefault(c.getCourseKey(), "과목" + c.getCourseKey());
                FactClassCourseStats cs = classStatsMap.get(c.getCourseKey());
                String rankStr = c.getClassRank() != null ? c.getClassRank() + "위" : "-";
                if (isStaff) {
                    String maxStr = cs != null && cs.getMaxScore() != null ? cs.getMaxScore().toString() : "-";
                    String minStr = cs != null && cs.getMinScore() != null ? cs.getMinScore().toString() : "-";
                    String cntStr = cs != null && cs.getStudentCount() != null ? cs.getStudentCount() + "명" : "-";
                    sb.append(String.format("%-12s %7s %7s %7s %7s %6s %6s %6s%n",
                            name,
                            nz(c.getAvgScore()), nz(c.getClassAvgScore()),
                            maxStr, minStr, cntStr, rankStr, nz(c.getGradeLevel())));
                    if (c.getAvgScore() != null && c.getClassAvgScore() != null
                            && c.getAvgScore().compareTo(c.getClassAvgScore()) < 0) {
                        sb.append("  [주의] ").append(name)
                          .append(": 반평균 하회 (내 점수 ").append(c.getAvgScore())
                          .append(" < 반평균 ").append(c.getClassAvgScore()).append(")\n");
                    }
                } else {
                    sb.append(String.format("%-12s %7s %7s %6s %6s%n",
                            name,
                            nz(c.getAvgScore()), nz(c.getClassAvgScore()),
                            rankStr, nz(c.getGradeLevel())));
                }
            }
        }

        // 학기 종합
        appendSection(sb, "학기 종합");
        sb.append("전체 평균: ").append(nz(s.getOverallAvgScore())).append("점");
        if (isStaff) {
            sb.append(" | 반 석차: ").append(nz(s.getOverallClassRank()));
            sb.append(" | 성적 추세 지수: ").append(nz(s.getScoreTrend()));
        }
        sb.append("\n");

        // 출결 현황
        appendSection(sb, "출결 현황");
        sb.append("출석률: ").append(nz(s.getAttendanceRate())).append("%")
          .append(" | 결석 ").append(nz(s.getAbsentCount())).append("일")
          .append(" | 지각 ").append(nz(s.getLateCount())).append("회")
          .append(" | 조퇴 ").append(nz(s.getEarlyLeaveCount())).append("회\n");

        // 피드백/상담 (학생은 건수만, 나머지는 상담 횟수 포함)
        if ("STUDENT".equals(role)) {
            appendSection(sb, "교사 피드백 요약");
            sb.append("총 ").append(nz(s.getFeedbackTotal())).append("건")
              .append(" (긍정 ").append(nz(s.getPositiveFeedback()))
              .append("건 / 부정 ").append(nz(s.getNegativeFeedback())).append("건)\n");
        } else {
            appendSection(sb, "피드백 및 상담");
            sb.append("피드백 총 ").append(nz(s.getFeedbackTotal())).append("건")
              .append(" (긍정 ").append(nz(s.getPositiveFeedback()))
              .append("건 / 부정 ").append(nz(s.getNegativeFeedback())).append("건)")
              .append(" | 상담 ").append(nz(s.getCounselingCount())).append("회\n");
        }

        // 위험 지표 (교사/관리자만)
        if (isStaff) {
            appendSection(sb, "위험 지표");
            boolean hasRisk = Boolean.TRUE.equals(s.getRiskFlag());
            sb.append("위험 플래그: ").append(hasRisk ? "주의 필요" : "정상").append("\n");
        }

        return sb.toString();
    }

    private void appendRoleInstructions(StringBuilder sb, String role) {
        sb.append("══════════════════════════════\n");
        sb.append("[공통 규칙]\n");
        sb.append("- 반드시 한국어로 답하세요.\n");
        sb.append("- 마크다운(##, **, -, * 등) 없이 일반 텍스트로만 답하세요.\n");
        sb.append("- 아래 학습 데이터에만 근거해 간결하게 답하세요. 불필요한 전체 분석 보고서를 자동으로 생성하지 마세요.\n");
        sb.append("- 질문이 학업/성적/출결/피드백과 무관하면 '학습 관련 질문만 답변드릴 수 있습니다'라고만 답하세요.\n");
        sb.append("- 데이터에 없는 내용은 '데이터가 없습니다'라고 답하세요.\n");
        switch (role) {
            case "STUDENT" -> {
                sb.append("- 학생 본인에게 친근하고 격려하는 톤으로 답하세요.\n");
                sb.append("- 다른 학생 정보, 위험 지표, 상담 세부내용 질문에는 '해당 정보에 접근 권한이 없습니다'라고 답하세요.\n");
            }
            case "PARENT" -> {
                sb.append("- 보호자에게 안심시키는 톤으로 답하세요.\n");
                sb.append("- 다른 학생 정보, 위험 지표, 교내 행정 내용 질문에는 '해당 정보에 접근 권한이 없습니다'라고 답하세요.\n");
            }
            case "TEACHER" -> {
                sb.append("- 교사에게 객관적이고 전문적으로 답하세요.\n");
                sb.append("- 성적 추세, 위험 지표, 출결 패턴을 바탕으로 지도 방향을 제시하세요.\n");
            }
            case "ADMIN" -> {
                sb.append("- 관리자에게 종합적이고 전문적으로 답하세요.\n");
            }
        }
        sb.append("══════════════════════════════\n");
    }

    private static void appendSection(StringBuilder sb, String title) {
        sb.append("\n── ").append(title).append(" ──\n");
    }

    private static String nz(Object value) {
        return value == null ? "데이터 없음" : value.toString();
    }
}
