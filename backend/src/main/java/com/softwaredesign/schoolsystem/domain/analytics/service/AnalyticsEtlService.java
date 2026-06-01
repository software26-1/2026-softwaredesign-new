package com.softwaredesign.schoolsystem.domain.analytics.service;

import com.softwaredesign.schoolsystem.domain.analytics.entity.EtlJobLog;
import com.softwaredesign.schoolsystem.domain.analytics.repository.EtlJobLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Batch ETL that rebuilds the analytics star schema from the operational
 * (public) tables. Dimensions and facts are written via native upserts
 * (INSERT ... SELECT ... ON CONFLICT DO UPDATE) so the read-side JPA entities
 * stay simple.
 *
 * Term granularity (year/semester) is derived from public.course
 * (academic_year, semester) since enrollment has no term columns.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsEtlService {

    private static final String JOB_NAME = "analytics_full_etl";

    @PersistenceContext
    private EntityManager em;

    private final EtlJobLogRepository etlJobLogRepository;

    /**
     * Scheduled nightly full ETL (03:00). Also invokable manually via triggerEtl().
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void runFullEtl() {
        triggerEtl();
    }

    /**
     * Runs the full ETL synchronously, recording an EtlJobLog row, and returns it.
     * Intended for ADMIN-triggered manual refresh.
     */
    @Transactional
    public EtlJobLog triggerEtl() {
        EtlJobLog log = etlJobLogRepository.save(EtlJobLog.start(JOB_NAME));
        try {
            int rows = 0;
            rows += refreshDimensions();
            rows += rebuildStudentCourseTermFacts();
            rows += rebuildLearningSummary();
            rows += rebuildClassCourseStats();
            log.finish("SUCCESS", rows, null);
        } catch (RuntimeException ex) {
            log.finish("FAILED", 0, truncate(ex.getMessage()));
            etlJobLogRepository.save(log);
            throw ex;
        }
        return etlJobLogRepository.save(log);
    }

    // ============================================================
    // Step 1: dimensions
    // ============================================================
    private int refreshDimensions() {
        int rows = 0;

        rows += em.createNativeQuery("""
                INSERT INTO analytics.dim_student
                    (student_key, student_name, class_group_id, class_name, grade_level, school_id, etl_loaded_at)
                SELECT s.id,
                       u.name,
                       s.class_group_id,
                       CONCAT(cg.academic_year, '-', cg.grade, '-', cg.class_number),
                       cg.grade,
                       s.school_id,
                       NOW()
                FROM public.student s
                JOIN public.users u ON u.id = s.user_id
                LEFT JOIN public.class_group cg ON cg.id = s.class_group_id
                WHERE s.is_deleted = false
                ON CONFLICT (student_key) DO UPDATE SET
                       student_name   = EXCLUDED.student_name,
                       class_group_id = EXCLUDED.class_group_id,
                       class_name     = EXCLUDED.class_name,
                       grade_level    = EXCLUDED.grade_level,
                       school_id      = EXCLUDED.school_id,
                       etl_loaded_at  = EXCLUDED.etl_loaded_at
                """).executeUpdate();

        rows += em.createNativeQuery("""
                INSERT INTO analytics.dim_course
                    (course_key, course_name, course_type, teacher_id, teacher_name, etl_loaded_at)
                SELECT c.id,
                       c.course_name,
                       c.course_type,
                       c.teacher_id,
                       u.name,
                       NOW()
                FROM public.course c
                LEFT JOIN public.teacher t ON t.id = c.teacher_id
                LEFT JOIN public.users u ON u.id = t.user_id
                WHERE c.is_deleted = false
                ON CONFLICT (course_key) DO UPDATE SET
                       course_name  = EXCLUDED.course_name,
                       course_type  = EXCLUDED.course_type,
                       teacher_id   = EXCLUDED.teacher_id,
                       teacher_name = EXCLUDED.teacher_name,
                       etl_loaded_at = EXCLUDED.etl_loaded_at
                """).executeUpdate();

        return rows;
    }

    // ============================================================
    // Step 2: per student+course+term grade facts
    // ============================================================
    private int rebuildStudentCourseTermFacts() {
        return em.createNativeQuery("""
                INSERT INTO analytics.fact_student_course_term
                    (student_key, course_key, year, semester, avg_score,
                     midterm_score, final_score, task_score, weighted_score,
                     class_rank, class_avg_score, grade_level, last_refreshed_at)
                WITH per_student AS (
                    SELECT e.student_id                                                AS student_key,
                           c.id                                                        AS course_key,
                           c.evaluation_type                                           AS evaluation_type,
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
                    GROUP BY e.student_id, c.id, c.evaluation_type, c.academic_year, c.semester, s.class_group_id
                ),
                ranked AS (
                    SELECT ps.*,
                           RANK() OVER (PARTITION BY ps.class_group_id, ps.course_key, ps.year, ps.semester
                                        ORDER BY ps.avg_score DESC NULLS LAST)         AS class_rank,
                           COUNT(*) OVER (PARTITION BY ps.class_group_id, ps.course_key, ps.year, ps.semester)
                                                                                       AS student_count,
                           AVG(ps.avg_score) OVER (PARTITION BY ps.class_group_id, ps.course_key, ps.year, ps.semester)
                                                                                       AS class_avg_score
                    FROM per_student ps
                )
                SELECT r.student_key,
                       r.course_key,
                       r.year,
                       r.semester,
                       r.avg_score,
                       r.midterm_score,
                       r.final_score,
                       r.task_score,
                       (COALESCE(r.midterm_score, 0) * r.midterm_ratio / 100.0
                        + COALESCE(r.final_score, 0) * r.final_ratio / 100.0
                        + COALESCE(r.task_score, 0) * r.task_ratio / 100.0)            AS weighted_score,
                       r.class_rank,
                       r.class_avg_score,
                       CASE
                         WHEN r.evaluation_type = 'ABSOLUTE' THEN
                           CASE
                             WHEN r.avg_score >= 90 THEN 'A'
                             WHEN r.avg_score >= 80 THEN 'B'
                             WHEN r.avg_score >= 70 THEN 'C'
                             WHEN r.avg_score >= 60 THEN 'D'
                             ELSE 'E'
                           END
                         ELSE
                           CASE
                             WHEN r.class_rank::float / r.student_count <= 0.04 THEN '1'
                             WHEN r.class_rank::float / r.student_count <= 0.11 THEN '2'
                             WHEN r.class_rank::float / r.student_count <= 0.23 THEN '3'
                             WHEN r.class_rank::float / r.student_count <= 0.40 THEN '4'
                             WHEN r.class_rank::float / r.student_count <= 0.60 THEN '5'
                             WHEN r.class_rank::float / r.student_count <= 0.77 THEN '6'
                             WHEN r.class_rank::float / r.student_count <= 0.89 THEN '7'
                             WHEN r.class_rank::float / r.student_count <= 0.96 THEN '8'
                             ELSE '9'
                           END
                       END                                                              AS grade_level,
                       NOW()
                FROM ranked r
                ON CONFLICT (student_key, course_key, year, semester) DO UPDATE SET
                       avg_score        = EXCLUDED.avg_score,
                       midterm_score    = EXCLUDED.midterm_score,
                       final_score      = EXCLUDED.final_score,
                       task_score       = EXCLUDED.task_score,
                       weighted_score   = EXCLUDED.weighted_score,
                       class_rank       = EXCLUDED.class_rank,
                       class_avg_score  = EXCLUDED.class_avg_score,
                       grade_level      = EXCLUDED.grade_level,
                       last_refreshed_at = EXCLUDED.last_refreshed_at
                """).executeUpdate();
    }

    // ============================================================
    // Step 3: per student+term learning summary
    // ============================================================
    private int rebuildLearningSummary() {
        int rows = 0;

        // 3a. Base rows: overall avg from course-term facts, plus class rank and
        //     score trend (LAG over prior term). Attendance/feedback/counseling
        //     filled by follow-up UPDATEs (correctness over single-statement elegance).
        rows += em.createNativeQuery("""
                INSERT INTO analytics.fact_student_learning_summary
                    (student_key, year, semester, overall_avg_score, overall_class_rank,
                     attendance_rate, absent_count, late_count, early_leave_count,
                     feedback_total, positive_feedback, negative_feedback,
                     counseling_count, score_trend, risk_flag, last_refreshed_at)
                WITH per_term AS (
                    SELECT f.student_key                  AS student_key,
                           f.year                         AS year,
                           f.semester                     AS semester,
                           ds.class_group_id              AS class_group_id,
                           AVG(f.avg_score)               AS overall_avg_score
                    FROM analytics.fact_student_course_term f
                    JOIN analytics.dim_student ds ON ds.student_key = f.student_key
                    GROUP BY f.student_key, f.year, f.semester, ds.class_group_id
                ),
                ranked AS (
                    SELECT pt.*,
                           RANK() OVER (PARTITION BY pt.class_group_id, pt.year, pt.semester
                                        ORDER BY pt.overall_avg_score DESC NULLS LAST) AS overall_class_rank,
                           LAG(pt.overall_avg_score) OVER (PARTITION BY pt.student_key
                                                           ORDER BY pt.year, pt.semester) AS prev_avg_score
                    FROM per_term pt
                )
                SELECT r.student_key,
                       r.year,
                       r.semester,
                       r.overall_avg_score,
                       r.overall_class_rank,
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
                       overall_class_rank = EXCLUDED.overall_class_rank,
                       score_trend        = EXCLUDED.score_trend,
                       last_refreshed_at  = EXCLUDED.last_refreshed_at
                """).executeUpdate();

        // 3b. Attendance counts + rate. Attendance has no term column, so we map
        //     a record's term by year = EXTRACT(YEAR FROM date) and
        //     semester = 1 for months 3-7, else 2 (Korean school calendar).
        rows += em.createNativeQuery("""
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
                    GROUP BY att.student_id,
                             CAST(EXTRACT(YEAR FROM att.date) AS INT),
                             CASE WHEN EXTRACT(MONTH FROM att.date) BETWEEN 3 AND 7 THEN 1 ELSE 2 END
                ) a
                WHERE sls.student_key = a.student_key
                  AND sls.year = a.year
                  AND sls.semester = a.semester
                """).executeUpdate();

        // 3c. Feedback totals (positive = ACADEMIC/ATTITUDE, negative = BEHAVIOR/ATTENDANCE).
        //     Feedback has no term column, so it is aggregated per student and applied
        //     to every term row for that student.
        rows += em.createNativeQuery("""
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
                    GROUP BY f.student_id
                ) fb
                WHERE sls.student_key = fb.student_key
                """).executeUpdate();

        // 3d. Counseling count per student (no term column).
        rows += em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary sls
                SET counseling_count = cc.counseling_count
                FROM (
                    SELECT c.student_id AS student_key,
                           COUNT(*) AS counseling_count
                    FROM public.counseling c
                    GROUP BY c.student_id
                ) cc
                WHERE sls.student_key = cc.student_key
                """).executeUpdate();

        // 3e. Risk flag: low attendance OR downward score trend.
        rows += em.createNativeQuery("""
                UPDATE analytics.fact_student_learning_summary
                SET risk_flag = (COALESCE(attendance_rate, 100) < 80 OR score_trend = 'DOWN')
                """).executeUpdate();

        return rows;
    }

    // ============================================================
    // Step 4: per class+course+term stats
    // ============================================================
    private int rebuildClassCourseStats() {
        return em.createNativeQuery("""
                INSERT INTO analytics.fact_class_course_stats
                    (class_group_id, course_key, year, semester, student_count,
                     avg_score, max_score, min_score, stddev_score,
                     avg_attendance_rate, last_refreshed_at)
                SELECT ds.class_group_id,
                       f.course_key,
                       f.year,
                       f.semester,
                       COUNT(DISTINCT f.student_key)            AS student_count,
                       AVG(f.avg_score)                         AS avg_score,
                       MAX(f.avg_score)                         AS max_score,
                       MIN(f.avg_score)                         AS min_score,
                       COALESCE(STDDEV_SAMP(f.avg_score), 0)    AS stddev_score,
                       AVG(sls.attendance_rate)                 AS avg_attendance_rate,
                       NOW()
                FROM analytics.fact_student_course_term f
                JOIN analytics.dim_student ds ON ds.student_key = f.student_key
                LEFT JOIN analytics.fact_student_learning_summary sls
                       ON sls.student_key = f.student_key
                      AND sls.year = f.year
                      AND sls.semester = f.semester
                WHERE ds.class_group_id IS NOT NULL
                GROUP BY ds.class_group_id, f.course_key, f.year, f.semester
                ON CONFLICT (class_group_id, course_key, year, semester) DO UPDATE SET
                       student_count       = EXCLUDED.student_count,
                       avg_score           = EXCLUDED.avg_score,
                       max_score           = EXCLUDED.max_score,
                       min_score           = EXCLUDED.min_score,
                       stddev_score        = EXCLUDED.stddev_score,
                       avg_attendance_rate = EXCLUDED.avg_attendance_rate,
                       last_refreshed_at   = EXCLUDED.last_refreshed_at
                """).executeUpdate();
    }

    private static String truncate(String msg) {
        if (msg == null) return null;
        return msg.length() > 1000 ? msg.substring(0, 1000) : msg;
    }
}
