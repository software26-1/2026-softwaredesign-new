package com.softwaredesign.schoolsystem.domain.attendance.dto;

import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class AttendanceCreateRequest {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "학급 ID는 필수입니다.")
    private Long classGroupId;

    @NotNull(message = "날짜는 필수입니다.")
    private LocalDate date;

    @NotNull(message = "출결 상태는 필수입니다.")
    private AttendanceStatus status;

    private String reason;
}
