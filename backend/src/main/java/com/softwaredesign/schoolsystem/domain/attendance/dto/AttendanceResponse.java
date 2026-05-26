package com.softwaredesign.schoolsystem.domain.attendance.dto;

import com.softwaredesign.schoolsystem.domain.attendance.entity.Attendance;
import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AttendanceResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final Long classGroupId;
    private final LocalDate date;
    private final AttendanceStatus status;
    private final String reason;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static AttendanceResponse from(Attendance attendance) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getStudent().getId(),
                attendance.getStudent().getUser().getName(),
                attendance.getClassGroup().getId(),
                attendance.getDate(),
                attendance.getStatus(),
                attendance.getReason(),
                attendance.getCreatedAt(),
                attendance.getUpdatedAt()
        );
    }
}
