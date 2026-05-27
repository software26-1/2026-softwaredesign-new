package com.softwaredesign.schoolsystem.domain.report.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class ReportGenerator {

    private static final String OUTPUT_DIR = "./generated-reports";

    /**
     * 주어진 Report에 대한 파일(PDF/Excel)을 로컬에 생성하고 경로를 반환한다.
     */
    public String generate(Report report) {
        ensureOutputDir();
        return switch (report.getFileFormat()) {
            case PDF -> generatePdf(report);
            case EXCEL -> generateExcel(report);
        };
    }

    private void ensureOutputDir() {
        try {
            Path dir = Paths.get(OUTPUT_DIR);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
        } catch (IOException e) {
            throw new IllegalStateException("리포트 저장 디렉토리를 생성할 수 없습니다.", e);
        }
    }

    private String generatePdf(Report report) {
        String path = OUTPUT_DIR + "/report-" + report.getId() + ".pdf";
        Document document = new Document();
        try (OutputStream out = new FileOutputStream(path)) {
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph(report.getReportType().name()));
            document.add(new Paragraph("리포트 본문 (자동 생성)"));
        } catch (IOException e) {
            throw new IllegalStateException("PDF 리포트 생성에 실패했습니다.", e);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
        return path;
    }

    private String generateExcel(Report report) {
        String path = OUTPUT_DIR + "/report-" + report.getId() + ".xlsx";
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             OutputStream out = new FileOutputStream(path)) {
            Sheet sheet = workbook.createSheet(report.getReportType().name());
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("항목");
            header.createCell(1).setCellValue("값");
            Row body = sheet.createRow(1);
            body.createCell(0).setCellValue(report.getReportType().name());
            body.createCell(1).setCellValue("리포트 본문 (자동 생성)");
            workbook.write(out);
        } catch (IOException e) {
            throw new IllegalStateException("Excel 리포트 생성에 실패했습니다.", e);
        }
        return path;
    }
}
