package com.softwaredesign.schoolsystem.domain.attendance.repository;

import com.softwaredesign.schoolsystem.domain.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate from, LocalDate to);
    List<Attendance> findByClassGroupIdAndDate(Long classGroupId, LocalDate date);
    List<Attendance> findByClassGroupIdAndDateBetween(Long classGroupId, LocalDate from, LocalDate to);
}
