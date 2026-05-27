package com.softwaredesign.schoolsystem.domain.report.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "report")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", length = 30, nullable = false)
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_format", length = 10, nullable = false)
    private FileFormat fileFormat;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    public static Report create(User requestedBy, ReportType reportType, FileFormat fileFormat) {
        Report report = new Report();
        report.requestedBy = requestedBy;
        report.reportType = reportType;
        report.fileFormat = fileFormat;
        return report;
    }

    public void complete(String filePath) {
        this.filePath = filePath;
        this.generatedAt = LocalDateTime.now();
    }
}
