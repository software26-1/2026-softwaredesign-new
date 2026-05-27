package com.softwaredesign.schoolsystem.domain.report.dto;

import com.softwaredesign.schoolsystem.domain.report.entity.FileFormat;
import com.softwaredesign.schoolsystem.domain.report.entity.ReportType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReportCreateRequest {

    @NotNull(message = "리포트 유형은 필수입니다.")
    private ReportType reportType;

    @NotNull(message = "파일 형식은 필수입니다.")
    private FileFormat fileFormat;
}
