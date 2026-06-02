package com.softwaredesign.schoolsystem.domain.analytics.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event-driven incremental analytics. Re-runs the same native upserts as
 * {@link AnalyticsEtlService} but SCOPED to a single student, so a grade /
 * attendance / feedback change only recomputes that student's
 * fact_student_course_term + fact_student_learning_summary rows.
 *
 * TODO: class-level stats (analytics.fact_class_course_stats) are intentionally
 *       left to the nightly full ETL — recomputing the affected class on every
 *       single-student change would be wasteful. Refresh them in the batch job.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsIncrementalService {

    @PersistenceContext
    private EntityManager em;

    /**
     * Recomputes the analytics facts for a single student from the operational
     * tables. Idempotent (upserts via ON CONFLICT).
     */
    // AFTER_COMMIT 리스너(AnalyticsEventBridge)에서 호출되므로 활성 트랜잭션이 없다.
    // REQUIRES_NEW 없이는 네이티브 upsert 실행 시 TransactionRequiredException이 나서
    // 성적/출결/피드백 변경이 분석 테이블에 반영되지 않는다(수동 ETL 전까지 stale).
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refreshStudent(Long studentId) {
        if (studentId == null) {
            return;
        }
        rebuildStudentCourseTermFacts(studentId);
        rebuildLearningSummary(studentId);
        Long classGroupId = getClassGroupId(studentId);
        if (classGroupId != null) {
            refreshClassCourseStats(classGroupId);
        }
    }

    private Long getClassGroupId(Long studentId) {
        List<?> rows = em.createNativeQuery(
                "SELECT class_group_id FROM analytics.dim_student WHERE student_key = :sid")
                .setParameter("sid", studentId)
                .getResultList();
        if (rows.isEmpty() || rows.get(0) == null) return null;
        Object val = rows.get(0);
        return val instanceof Number n ? n.longValue() : null;
    }

    private void refreshClassCourseStats(Long classGroupId) {
        em.createNativeQuery("""
                DELETE FROM analytics.fact_class_course_stats s
                WHERE s.class_group_id = :cg
                  AND NOT EXISTS (
                      SELECT 1
                      FROM analytics.fact_student_course_term f
                      JOIN analytics.dim_student ds ON ds.student_key = f.student_key
                      WHERE ds.class_group_id = :cg
                        AND f.course_key = s.course_key
                        AND f.year       = s.year
                        AND f.semester   = s.semester
                  )
                """)
                .setParameter("cg", classGroupId)
                .executeUpdate();

        em.createNativeQuery("""
                INSERT INTO analytics.fact_class_course_stats
                    (class_group_id, course_key, year, semester, student_count,
                     avg_score, max_score, min_score, stddev_score,
                     avg_attendance_rate, last_refreshed_at)
                SELECT ds.class_group_id,
                       f.course_key,
                       f.year,
                       f.semester,
                       COUNT(DISTINCT f.student_key),
                       AVG(f.avg_score),
                       MAX(f.avg_score),
                       MIN(f.avg_score),
                       COALESCE(STDDEV_SAMP(f.avg_score), 0),
                       AVG(sls.attendance_rate),
                       NOW()
                FROM analytics.fact_student_course_term f
                JOIN analytics.dim_student ds ON ds.student_key = f.student_key
                LEFT JOIN analytics.fact_student_learning_summary sls
                       ON sls.student_key = f.student_key
                      AND sls.year = f.year
                      AND sls.semester = f.semester
                WHERE ds.class_group_id = :cg
                GROUP BY ds.class_group_id, f.course_key, f.year, f.semester
                ON CONFLICT (class_group_id, course_key, year, semester) DO UPDATE SET
                       student_count       = EXCLUDED.student_count,
                       avg_score           = EXCLUDED.avg_score,
                       max_score           = EXCLUDED.max_score,
                       min_score           = EXCLUDED.min_score,
                       stddev_score        = EXCLUDED.stddev_score,
                       avg_attendance_rate = EXCLUDED.avg_attendance_rate,
                       last_refreshed_at   = EXCLUDED.last_refreshed_at
                """)
                .setParameter("cg", classGroupId)
                .executeUpdate();
    }

    // ============================================================
    // Per student+course+term grade facts (scoped to one student)
    // ============================================================
    private void rebuildStudentCourseTermFacts(Long studentId) {
        em.createNativeQuery("""
                INSERT INTO analytics.fact_student_course_term
                    (student_key, course_key, year, semester, avg_score,
                     midterm_score, final_score, task_score, weighted_score,
                     class_rank, class_avg_score, last_refreshed_at)
                WITH per_student AS (
                    SELECT e.student_id                                                AS student_key,
                           c.id                                                        AS course_key,
                           c.academic_year                                             AS year,
                           c.semester                                                  AS semester,
                           s.class_group_id                                            AS class_group_id,
                           AVG(g.score)                                                AS avg_score,
                           AVG(g.score) FILTER (WHERE g.grade_type = 'MIDTERM')        AS midterm_score,
                           AVG(g.score) FILTER (WHERE g.grade_type = 'FINAL')          AS final_score,
                           AVG(g.score) FILTER (WHERE g.grade_type = 'ASSIGNMENT')     AS task_score,
                           MAX(c.midterm_ratio)                                        AS midterm_ratio,
                           MAX(c.final_ratio)                                          AS final_ratio,
                           MAX(c.task_ratio)                                           AS task_ratio
                    FROM public.grade g
                    JOIN public.enrollment e ON e.id = g.enrollment_id AND e.is_deleted = false
                    JOIN public.course c     ON c.id = e.course_id AND c.is_deleted = false
                    JOIN public.student s    ON s.id = e.student_id AND s.is_deleted = false
                    WHERE e.student_id = :studentId AND g.is_deleted = false
                    GROUP BY e.student_id, c.id, c.academic_year, c.semester, s.class_group_id
                )
                SELECT ps.student_key,
                       ps.course_key,
                       ps.year,
                       ps.semester,
                       ps.avg_score,
                       ps.midterm_score,
                       ps.final_score,
                       ps.task_score,
                       (COALESCE(ps.midterm_score, 0) * ps.midterm_ratio / 100.0
                        + COALESCE(ps.final_score, 0) * ps.final_ratio / 100.0
                        + COALESCE(ps.task_score, 0) * ps.task_ratio / 100.0)          AS weighted_score,
                       NULL,
                       NULL,
                       NOW()
                FROM per_student ps
                ON CONFLICT (student_key, course_key, year, semester) DO UPDATE SET
                       avg_score        = EXCLUDED.avg_score,
                       midterm_score    = EXCLUDED.midterm_score,
                       final_score      = EXCLUDED.final_score,
                       task_score       = EXCLUDED.task_score,
                       weighted_score   = EXCLUDED.weighted_score,
                       last_refreshed_at = EXCLUDED.last_refreshed_at
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();
        // NOTE: class_rank / class_avg_score are class-relative window aggregates
        //       and cannot be correctly computed from one student's rows. They are
        //       left untouched here (NULL on insert, preserved on update) and
        //       recomputed by the nightly full ETL. TODO: refresh affected class.
    }

    // ============================================================
    // Per student+term learning summary (scoped to one student)
    // ============================================================
    private void rebuildLearningSummary(Long studentId) {
        // Base rows: overall avg from this student's course-term facts plus score
        // trend (LAG over prior term). overall_class_rank is class-relative and is
        // left to the nightly full ETL (NULL on insert, preserved on update).
        em.createNativeQuery("""
                INSERT INTO analytics.fact_student_learning_summary
                    (student_key, year, semester, overall_avg_score, overall_class_rank,
                     attendance_rate, absent_count, late_count, early_leave_count,
                     feedback_total, positive_feedback, negative_feedback,
                     counseling_count, score_trend, risk_flag, last_refreshed_at)
                WITH per_term AS (
                    SELECT f.student_key                  AS student_key,
                           f.year                         AS year,
                           f.semester                     AS semester,
                           AVG(f.avg_score)               AS overall_avg_score
                    FROM analytics.fact_student_course_term f
                    WHERE f.student_key = :studentId
                    GROUP BY f.student_key, f.year, f.semester
                ),
                ranked AS (
                    SELECT pt.*,
                           LAG(pt.overall_avg_score) OVER (PARTITION BY pt.student_key
                                                           ORDER BY pt.year, pt.semester) AS prev_avg_score
                    FROM per_term pt
                )
                SELECT r.student_key,
                       r.year,
                       r.semester,
                       r.overall_avg_score,
                       NULL,
                       NULL,
                       0, 0, 0,
                       0, 0, 0,
                       0,
                       CASE
                           WHEN r.prev_avg_score IS NULL THEN 'STABLE'
                           WHEN r.overall_avg_score - r.prev_avg_score > 2.0 THEN 'UP'
                           WHEN r.prev_avg_score - r.overall_avg_score > 2.0 THEN 'DOWN'
                           ELSE 'STABLE'
                       END,
                       false,
                       NOW()
                FROM ranked r
                ON CONFLICT (student_key, year, semester) DO UPDATE SET
                       overall_avg_score  = EXCLUDED.overall_avg_score,
                       score_trend        = EXCLUDED.score_trend,
                       last_refreshed_at  = EXCLUDED.last_refreshed_at
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();

        // Attendance counts + rate for this student.
        em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary sls
                SET absent_count      = a.absent_count,
                    late_count        = a.late_count,
                    early_leave_count = a.early_leave_count,
                    attendance_rate   = CASE WHEN a.total_count > 0
                                             THEN ROUND(a.present_count * 100.0 / a.total_count, 2)
                                             ELSE NULL END
                FROM (
                    SELECT att.student_id AS student_key,
                           CAST(EXTRACT(YEAR FROM att.date) AS INT) AS year,
                           CASE WHEN EXTRACT(MONTH FROM att.date) BETWEEN 3 AND 7 THEN 1 ELSE 2 END AS semester,
                           COUNT(*) AS total_count,
                           COUNT(*) FILTER (WHERE att.status = 'PRESENT')     AS present_count,
                           COUNT(*) FILTER (WHERE att.status = 'ABSENT')      AS absent_count,
                           COUNT(*) FILTER (WHERE att.status = 'LATE')        AS late_count,
                           COUNT(*) FILTER (WHERE att.status = 'EARLY_LEAVE') AS early_leave_count
                    FROM public.attendance att
                    WHERE att.student_id = :studentId
                    GROUP BY att.student_id,
                             CAST(EXTRACT(YEAR FROM att.date) AS INT),
                             CASE WHEN EXTRACT(MONTH FROM att.date) BETWEEN 3 AND 7 THEN 1 ELSE 2 END
                ) a
                WHERE sls.student_key = a.student_key
                  AND sls.year = a.year
                  AND sls.semester = a.semester
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();

        // Feedback totals for this student (applied to every term row).
        em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary sls
                SET feedback_total    = fb.feedback_total,
                    positive_feedback = fb.positive_feedback,
                    negative_feedback = fb.negative_feedback
                FROM (
                    SELECT f.student_id AS student_key,
                           COUNT(*) AS feedback_total,
                           COUNT(*) FILTER (WHERE f.type IN ('ACADEMIC', 'ATTITUDE'))   AS positive_feedback,
                           COUNT(*) FILTER (WHERE f.type IN ('BEHAVIOR', 'ATTENDANCE')) AS negative_feedback
                    FROM public.feedback f
                    WHERE f.student_id = :studentId
                    GROUP BY f.student_id
                ) fb
                WHERE sls.student_key = fb.student_key
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();

        // Counseling count for this student.
        em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary sls
                SET counseling_count = cc.counseling_count
                FROM (
                    SELECT c.student_id AS student_key,
                           COUNT(*) AS counseling_count
                    FROM public.counseling c
                    WHERE c.student_id = :studentId
                    GROUP BY c.student_id
                ) cc
                WHERE sls.student_key = cc.student_key
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();

        // Risk flag for this student's term rows.
        em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary
                SET risk_flag = (COALESCE(attendance_rate, 100) < 80 OR score_trend = 'DOWN')
                WHERE student_key = :studentId
                """)
                .setParameter("studentId", studentId)
                .executeUpdate();
    }
}
