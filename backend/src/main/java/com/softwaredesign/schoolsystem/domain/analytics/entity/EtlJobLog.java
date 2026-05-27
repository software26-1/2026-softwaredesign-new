package com.softwaredesign.schoolsystem.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "etl_job_log", schema = "analytics")
public class EtlJobLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name")
    private String jobName;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "status")
    private String status;

    @Column(name = "rows_processed")
    private Integer rowsProcessed;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public static EtlJobLog start(String jobName) {
        EtlJobLog log = new EtlJobLog();
        log.jobName = jobName;
        log.startedAt = LocalDateTime.now();
        log.status = "RUNNING";
        log.rowsProcessed = 0;
        return log;
    }

    public void finish(String status, int rowsProcessed, String errorMessage) {
        this.status = status;
        this.rowsProcessed = rowsProcessed;
        this.errorMessage = errorMessage;
        this.finishedAt = LocalDateTime.now();
    }
}
