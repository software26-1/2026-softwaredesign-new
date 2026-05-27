package com.softwaredesign.schoolsystem.domain.student.service;

import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceSummaryResponse;
import com.softwaredesign.schoolsystem.domain.attendance.entity.Attendance;
import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import com.softwaredesign.schoolsystem.domain.attendance.repository.AttendanceRepository;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingResponse;
import com.softwaredesign.schoolsystem.domain.counseling.repository.CounselingRepository;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeResponse;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeRepository;
import com.softwaredesign.schoolsystem.domain.student.dto.IntegratedSearchResponse;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IntegratedSearchService {

    private final StudentRepository studentRepository;
    private final GradeRepository gradeRepository;
    private final FeedbackRepository feedbackRepository;
    private final CounselingRepository counselingRepository;
    private final AttendanceRepository attendanceRepository;

    public IntegratedSearchResponse search(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        List<GradeResponse> grades = gradeRepository.findByStudentId(studentId).stream()
                .map(GradeResponse::from).toList();
        List<FeedbackResponse> feedbacks = feedbackRepository.findByStudentId(studentId).stream()
                .map(FeedbackResponse::from).toList();
        List<CounselingResponse> counselings = counselingRepository.findByStudentId(studentId).stream()
                .map(CounselingResponse::from).toList();

        AttendanceSummaryResponse attendanceSummary = buildAttendanceSummary(studentId, student);

        return new IntegratedSearchResponse(
                IntegratedSearchResponse.StudentInfo.from(student),
                grades,
                feedbacks,
                counselings,
                attendanceSummary);
    }

    private AttendanceSummaryResponse buildAttendanceSummary(Long studentId, Student student) {
        List<Attendance> list = attendanceRepository.findByStudentId(studentId);
        long present = list.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long late = list.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long earlyLeave = list.stream().filter(a -> a.getStatus() == AttendanceStatus.EARLY_LEAVE).count();
        return new AttendanceSummaryResponse(
                studentId, student.getUser().getName(), present, absent, late, earlyLeave, list.size());
    }
}
