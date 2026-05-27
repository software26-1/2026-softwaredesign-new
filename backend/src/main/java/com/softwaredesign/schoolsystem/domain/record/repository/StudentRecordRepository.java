package com.softwaredesign.schoolsystem.domain.record.repository;

import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRecordRepository extends JpaRepository<StudentRecord, Long> {
    Optional<StudentRecord> findByStudentId(Long studentId);
}
