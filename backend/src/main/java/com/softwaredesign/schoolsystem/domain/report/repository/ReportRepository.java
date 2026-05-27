package com.softwaredesign.schoolsystem.domain.report.repository;

import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import com.softwaredesign.schoolsystem.domain.report.entity.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByRequestedById(Long requestedById);
    List<Report> findByReportType(ReportType reportType);
}
