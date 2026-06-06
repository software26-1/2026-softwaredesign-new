package com.softwaredesign.schoolsystem.domain.record.repository;

import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRecordRepository extends JpaRepository<StudentRecord, Long> {

    // 특정 학년/학기 학생부 (작성/수정/조회의 고유 키)
    Optional<StudentRecord> findByStudentIdAndAcademicYearAndSemester(Long studentId, int academicYear, int semester);

    // 가장 최근 학년/학기 학생부 (학기 미지정 조회 시 기본값 — 기존 호출 호환)
    Optional<StudentRecord> findTopByStudentIdOrderByAcademicYearDescSemesterDesc(Long studentId);

    // 학생의 전체 학생부 이력 (최신순)
    List<StudentRecord> findAllByStudentIdOrderByAcademicYearDescSemesterDesc(Long studentId);
}
