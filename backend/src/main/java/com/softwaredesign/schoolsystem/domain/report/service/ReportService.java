package com.softwaredesign.schoolsystem.domain.report.service;

import com.softwaredesign.schoolsystem.domain.report.dto.ReportCreateRequest;
import com.softwaredesign.schoolsystem.domain.report.dto.ReportResponse;
import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import com.softwaredesign.schoolsystem.domain.report.entity.ReportType;
import com.softwaredesign.schoolsystem.domain.report.repository.ReportRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ReportGenerator reportGenerator;
    private final ReportStorageService reportStorage;

    @Transactional
    public ReportResponse create(ReportCreateRequest req, Long userId) {
        User requestedBy = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Report report = Report.create(requestedBy, req.getReportType(), req.getFileFormat());
        reportRepository.save(report);

        // 동기 생성 (단순화를 위해 @Async 미사용) 후 저장소(S3 또는 로컬)에 보관
        String localPath = reportGenerator.generate(report);
        String storedPath = reportStorage.persist(report, localPath);
        report.complete(storedPath);

        return ReportResponse.from(report);
    }

    public List<ReportResponse> getAll(ReportType reportTypeOrNull, Long userId) {
        List<Report> list = (reportTypeOrNull != null)
                ? reportRepository.findByReportType(reportTypeOrNull)
                : reportRepository.findByRequestedById(userId);
        return list.stream().map(ReportResponse::from).toList();
    }

    public Report getForDownload(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("리포트를 찾을 수 없습니다."));
        if (report.getFilePath() == null) {
            throw new IllegalStateException("아직 생성되지 않은 리포트입니다.");
        }
        return report;
    }

    public byte[] readBytes(Report report) {
        return reportStorage.read(report.getFilePath());
    }
}
