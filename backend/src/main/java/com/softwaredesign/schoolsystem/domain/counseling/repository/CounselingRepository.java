package com.softwaredesign.schoolsystem.domain.counseling.repository;

import com.softwaredesign.schoolsystem.domain.counseling.entity.Counseling;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CounselingRepository extends JpaRepository<Counseling, Long> {
    List<Counseling> findByStudentId(Long studentId);
    List<Counseling> findByTeacherId(Long teacherId);
    List<Counseling> findByStudentIdAndIsSharedTrue(Long studentId);
    List<Counseling> findByIsSharedTrue();
}
