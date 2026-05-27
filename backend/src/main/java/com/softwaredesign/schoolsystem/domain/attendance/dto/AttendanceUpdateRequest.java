package com.softwaredesign.schoolsystem.domain.attendance.dto;

import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AttendanceUpdateRequest {
    private AttendanceStatus status;
    private String reason;
}
