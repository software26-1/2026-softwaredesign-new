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

/**
 * [미사용 안내 — 2026-06-06]
 * 보고서는 현재 프론트엔드에서 전적으로 생성한다(PDF: window.print(), Excel: ExcelJS).
 * 즉 사용자가 버튼 클릭 시 즉석에서 만들어 본인 PC 로 바로 내려받으므로,
 * 서버 생성(POST /reports)·서버 저장·S3 저장·서버 다운로드(GET /reports/{id}/download)
 * 가 실제 사용 흐름에서 호출되지 않는다. (프론트 reportService.ts 도 주석 처리됨)
 *
 * 이 컨트롤러/서비스/스토리지(S3 분기)는 설계 당시 서버 생성 방식의 잔재로,
 * 이력 보존을 위해 코드만 유지한다. 보고서를 서버/S3 에 저장할 이유가 없다는
 * 판단(스토리지 중복·스냅샷 고정·민감정보 보관 부담)에 따른 의도적 결정이다.
 * S3 는 보고서 저장이 아니라 DB 백업 용도로 재활용되었다(scripts/db-backup.sh).
 */
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
