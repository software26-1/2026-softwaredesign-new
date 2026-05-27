package com.softwaredesign.schoolsystem.domain.report.dto;

import com.softwaredesign.schoolsystem.domain.report.entity.FileFormat;
import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import com.softwaredesign.schoolsystem.domain.report.entity.ReportType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class ReportResponse {
    private final Long id;
    private final ReportType reportType;
    private final FileFormat fileFormat;
    private final String filePath;
    private final LocalDateTime generatedAt;
    private final LocalDateTime createdAt;

    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReportType(),
                report.getFileFormat(),
                report.getFilePath(),
                report.getGeneratedAt(),
                report.getCreatedAt()
        );
    }
}
