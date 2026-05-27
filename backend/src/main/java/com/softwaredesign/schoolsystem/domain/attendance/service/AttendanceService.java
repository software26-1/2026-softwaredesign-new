package com.softwaredesign.schoolsystem.domain.attendance.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceCreateRequest;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceResponse;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceSummaryResponse;
import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceUpdateRequest;
import com.softwaredesign.schoolsystem.domain.attendance.entity.Attendance;
import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import com.softwaredesign.schoolsystem.domain.attendance.repository.AttendanceRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.analytics.event.AttendanceChangedEvent;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final ClassGroupRepository classGroupRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public AttendanceResponse createAttendance(AttendanceCreateRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        ClassGroup classGroup = classGroupRepository.findById(request.getClassGroupId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));

        Attendance attendance = Attendance.createAttendance(
                student, classGroup, request.getDate(), request.getStatus(), request.getReason());
        attendanceRepository.save(attendance);
        eventPublisher.publishEvent(new AttendanceChangedEvent(student.getId()));
        return AttendanceResponse.from(attendance);
    }

    public List<AttendanceResponse> getByStudent(Long studentId, LocalDate from, LocalDate to, AuthUser authUser) {
        studentId = resolveStudentId(studentId, authUser);
        if (from != null && to != null) {
            return attendanceRepository.findByStudentIdAndDateBetween(studentId, from, to)
                    .stream().map(AttendanceResponse::from).toList();
        }
        return attendanceRepository.findByStudentId(studentId)
                .stream().map(AttendanceResponse::from).toList();
    }

    public List<AttendanceResponse> getByClassGroupAndDate(Long classGroupId, LocalDate date) {
        return attendanceRepository.findByClassGroupIdAndDate(classGroupId, date)
                .stream().map(AttendanceResponse::from).toList();
    }

    public AttendanceSummaryResponse getSummary(Long studentId, LocalDate from, LocalDate to, AuthUser authUser) {
        studentId = resolveStudentId(studentId, authUser);
        List<Attendance> list = attendanceRepository.findByStudentIdAndDateBetween(studentId, from, to);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        long present = list.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long late = list.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long earlyLeave = list.stream().filter(a -> a.getStatus() == AttendanceStatus.EARLY_LEAVE).count();

        return new AttendanceSummaryResponse(
                studentId, student.getUser().getName(), present, absent, late, earlyLeave, list.size());
    }

    @Transactional
    public AttendanceResponse updateAttendance(Long attendanceId, AttendanceUpdateRequest request) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("출결 정보를 찾을 수 없습니다."));
        attendance.updateAttendance(request.getStatus(), request.getReason());
        eventPublisher.publishEvent(new AttendanceChangedEvent(attendance.getStudent().getId()));
        return AttendanceResponse.from(attendance);
    }

    @Transactional
    public void deleteAttendance(Long attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("출결 정보를 찾을 수 없습니다."));
        Long studentId = attendance.getStudent().getId();
        attendanceRepository.delete(attendance);
        eventPublisher.publishEvent(new AttendanceChangedEvent(studentId));
    }

    private Long resolveStudentId(Long requestedStudentId, AuthUser authUser) {
        String role = authUser.role();
        if ("STUDENT".equals(role)) {
            return studentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .orElseThrow(() -> new AccessDeniedException("학생 정보를 찾을 수 없습니다."))
                    .getId();
        }
        if ("PARENT".equals(role)) {
            Long targetStudentId = requestedStudentId;
            parentRepository.findByUserIdAndIsDeletedFalse(authUser.id())
                    .map(parent -> parentStudentRepository.findAllByParentIdAndIsDeletedFalse(parent.getId()))
                    .filter(list -> list.stream().anyMatch(ps -> ps.getStudent().getId().equals(targetStudentId)))
                    .orElseThrow(() -> new AccessDeniedException("자녀의 출결만 조회할 수 있습니다."));
            return requestedStudentId;
        }
        return requestedStudentId;
    }
}
