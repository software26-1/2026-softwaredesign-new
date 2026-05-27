package com.softwaredesign.schoolsystem.domain.report.service;

import com.softwaredesign.schoolsystem.domain.report.entity.Report;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 보고서 파일 저장 추상화.
 * - S3 비활성(기본): 로컬 경로를 그대로 사용.
 * - S3 활성: 로컬 생성 파일을 S3로 업로드하고 "s3://bucket/key" 경로를 반환. 실패 시 로컬 경로로 폴백.
 * S3 클라이언트는 최초 사용 시 lazy 초기화하므로 자격증명 없이도 앱 기동에 영향이 없다.
 */
@Component
public class ReportStorageService {

    private static final Logger log = LoggerFactory.getLogger(ReportStorageService.class);
    private static final String S3_PREFIX = "s3://";

    private final boolean s3Enabled;
    private final String bucket;
    private final String region;

    private volatile S3Client s3Client;

    public ReportStorageService(
            @Value("${app.report.s3.enabled}") boolean s3Enabled,
            @Value("${app.report.s3.bucket}") String bucket,
            @Value("${app.report.s3.region}") String region) {
        this.s3Enabled = s3Enabled;
        this.bucket = bucket;
        this.region = region;
    }

    /** 로컬 생성 파일을 최종 저장소에 보관하고 저장 경로를 반환한다. */
    public String persist(Report report, String localPath) {
        if (!s3Enabled || bucket == null || bucket.isBlank()) {
            return localPath;
        }
        try {
            String key = "reports/report-" + report.getId() + extension(localPath);
            client().putObject(
                    PutObjectRequest.builder().bucket(bucket).key(key).build(),
                    RequestBody.fromFile(Paths.get(localPath)));
            return S3_PREFIX + bucket + "/" + key;
        } catch (Exception e) {
            log.error("[report] S3 업로드 실패, 로컬 경로로 폴백: {}", e.getMessage());
            return localPath;
        }
    }

    /** 저장 경로(로컬 또는 s3://)에서 파일 바이트를 읽는다. */
    public byte[] read(String storedPath) {
        if (storedPath != null && storedPath.startsWith(S3_PREFIX)) {
            return readFromS3(storedPath);
        }
        return readLocal(storedPath);
    }

    private byte[] readFromS3(String s3Path) {
        String withoutScheme = s3Path.substring(S3_PREFIX.length());
        int slash = withoutScheme.indexOf('/');
        String b = withoutScheme.substring(0, slash);
        String key = withoutScheme.substring(slash + 1);
        try {
            return client().getObject(
                    GetObjectRequest.builder().bucket(b).key(key).build(),
                    ResponseTransformer.toBytes()).asByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("S3에서 리포트 파일을 읽을 수 없습니다.", e);
        }
    }

    private byte[] readLocal(String localPath) {
        try {
            Path path = Paths.get(localPath);
            if (!Files.exists(path)) {
                throw new IllegalStateException("리포트 파일이 존재하지 않습니다.");
            }
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new IllegalStateException("리포트 파일을 읽을 수 없습니다.", e);
        }
    }

    private String extension(String path) {
        int dot = path.lastIndexOf('.');
        return dot >= 0 ? path.substring(dot) : "";
    }

    private S3Client client() {
        if (s3Client == null) {
            synchronized (this) {
                if (s3Client == null) {
                    s3Client = S3Client.builder().region(Region.of(region)).build();
                }
            }
        }
        return s3Client;
    }
}
