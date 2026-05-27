package com.softwaredesign.schoolsystem.domain.report.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.report.dto.ReportCreateRequest;
import com.softwaredesign.schoolsystem.domain.report.dto.ReportResponse;
import com.softwaredesign.schoolsystem.domain.report.entity.FileFormat;
import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import com.softwaredesign.schoolsystem.domain.report.entity.ReportType;
import com.softwaredesign.schoolsystem.domain.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ReportResponse> create(
            @Valid @RequestBody ReportCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.create(request, authUser.id()));
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ReportResponse>> getAll(
            @RequestParam(name = "report_type", required = false) ReportType reportType,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(reportService.getAll(reportType, authUser.id()));
    }

    @GetMapping("/{reportId}/download")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> download(@PathVariable Long reportId) {
        Report report = reportService.getForDownload(reportId);
        byte[] bytes = reportService.readBytes(report);

        boolean isPdf = report.getFileFormat() == FileFormat.PDF;
        MediaType mediaType = isPdf
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String fileName = "report-" + report.getId() + (isPdf ? ".pdf" : ".xlsx");

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .body(bytes);
    }
}
