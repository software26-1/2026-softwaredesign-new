package com.softwaredesign.schoolsystem.domain.attendance.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attendance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_group_id", nullable = false)
    private ClassGroup classGroup;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    private String reason;

    public static Attendance createAttendance(Student student, ClassGroup classGroup,
                                               LocalDate date, AttendanceStatus status, String reason) {
        Attendance attendance = new Attendance();
        attendance.student = student;
        attendance.classGroup = classGroup;
        attendance.date = date;
        attendance.status = status;
        attendance.reason = reason;
        return attendance;
    }

    public void updateAttendance(AttendanceStatus status, String reason) {
        if (status != null) this.status = status;
        if (reason != null) this.reason = reason;
    }
}
