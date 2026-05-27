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
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceService 단위 테스트")
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ClassGroupRepository classGroupRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AttendanceService attendanceService;

    private static final Long STUDENT_ID = 100L;
    private static final Long CLASS_GROUP_ID = 200L;
    private static final LocalDate DATE = LocalDate.of(2026, 5, 1);

    private Student student;
    private ClassGroup classGroup;

    @BeforeEach
    void setUp() {
        User studentUser = org.mockito.Mockito.mock(User.class);
        lenient().when(studentUser.getName()).thenReturn("이학생");
        student = org.mockito.Mockito.mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);
        classGroup = org.mockito.Mockito.mock(ClassGroup.class);
        lenient().when(classGroup.getId()).thenReturn(CLASS_GROUP_ID);
    }

    private Attendance buildAttendance(AttendanceStatus status) {
        return Attendance.createAttendance(student, classGroup, DATE, status, null);
    }

    private AttendanceCreateRequest createRequest() {
        AttendanceCreateRequest req = new AttendanceCreateRequest();
        ReflectionTestUtils.setField(req, "studentId", STUDENT_ID);
        ReflectionTestUtils.setField(req, "classGroupId", CLASS_GROUP_ID);
        ReflectionTestUtils.setField(req, "date", DATE);
        ReflectionTestUtils.setField(req, "status", AttendanceStatus.PRESENT);
        return req;
    }

    @Test
    @DisplayName("출결을 생성하면 저장되고 이벤트가 발행된다")
    void createAttendance_success() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(classGroupRepository.findById(CLASS_GROUP_ID)).willReturn(Optional.of(classGroup));

        AttendanceResponse response = attendanceService.createAttendance(createRequest());

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        verify(attendanceRepository).save(any(Attendance.class));
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void createAttendance_studentNotFound() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.createAttendance(createRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("학급을 찾을 수 없으면 IllegalArgumentException 발생")
    void createAttendance_classGroupNotFound() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(classGroupRepository.findById(CLASS_GROUP_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.createAttendance(createRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학급");
    }

    @Test
    @DisplayName("기간이 주어지면 기간 범위로 출결을 조회한다")
    void getByStudent_withRange() {
        given(attendanceRepository.findByStudentIdAndDateBetween(STUDENT_ID, DATE, DATE))
                .willReturn(List.of(buildAttendance(AttendanceStatus.PRESENT)));

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        List<AttendanceResponse> result = attendanceService.getByStudent(STUDENT_ID, DATE, DATE, teacher);

        assertThat(result).hasSize(1);
        verify(attendanceRepository).findByStudentIdAndDateBetween(STUDENT_ID, DATE, DATE);
    }

    @Test
    @DisplayName("기간이 없으면 학생 전체 출결을 조회한다")
    void getByStudent_withoutRange() {
        given(attendanceRepository.findByStudentId(STUDENT_ID))
                .willReturn(List.of(buildAttendance(AttendanceStatus.PRESENT)));

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        List<AttendanceResponse> result = attendanceService.getByStudent(STUDENT_ID, null, null, teacher);

        assertThat(result).hasSize(1);
        verify(attendanceRepository).findByStudentId(STUDENT_ID);
    }

    @Test
    @DisplayName("학급/날짜별 출결을 조회한다")
    void getByClassGroupAndDate_success() {
        given(attendanceRepository.findByClassGroupIdAndDate(CLASS_GROUP_ID, DATE))
                .willReturn(List.of(buildAttendance(AttendanceStatus.LATE)));

        List<AttendanceResponse> result = attendanceService.getByClassGroupAndDate(CLASS_GROUP_ID, DATE);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("출결 요약은 상태별 개수를 집계한다")
    void getSummary_aggregates() {
        given(attendanceRepository.findByStudentIdAndDateBetween(STUDENT_ID, DATE, DATE)).willReturn(List.of(
                buildAttendance(AttendanceStatus.PRESENT),
                buildAttendance(AttendanceStatus.ABSENT),
                buildAttendance(AttendanceStatus.LATE),
                buildAttendance(AttendanceStatus.EARLY_LEAVE),
                buildAttendance(AttendanceStatus.PRESENT)));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        AttendanceSummaryResponse summary = attendanceService.getSummary(STUDENT_ID, DATE, DATE, teacher);

        assertThat(summary.getPresent()).isEqualTo(2);
        assertThat(summary.getAbsent()).isEqualTo(1);
        assertThat(summary.getLate()).isEqualTo(1);
        assertThat(summary.getEarlyLeave()).isEqualTo(1);
        assertThat(summary.getTotal()).isEqualTo(5);
    }

    @Test
    @DisplayName("출결 요약 시 학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void getSummary_studentNotFound() {
        given(attendanceRepository.findByStudentIdAndDateBetween(STUDENT_ID, DATE, DATE)).willReturn(List.of());
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        assertThatThrownBy(() -> attendanceService.getSummary(STUDENT_ID, DATE, DATE, teacher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("출결을 수정하면 상태가 갱신되고 이벤트가 발행된다")
    void updateAttendance_success() {
        Attendance attendance = buildAttendance(AttendanceStatus.PRESENT);
        given(attendanceRepository.findById(1L)).willReturn(Optional.of(attendance));
        AttendanceUpdateRequest req = new AttendanceUpdateRequest();
        ReflectionTestUtils.setField(req, "status", AttendanceStatus.ABSENT);
        ReflectionTestUtils.setField(req, "reason", "병결");

        AttendanceResponse response = attendanceService.updateAttendance(1L, req);

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.ABSENT);
        assertThat(response.getReason()).isEqualTo("병결");
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("존재하지 않는 출결 수정 시 IllegalArgumentException 발생")
    void updateAttendance_notFound() {
        given(attendanceRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.updateAttendance(1L, new AttendanceUpdateRequest()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("출결을 삭제하면 delete 와 이벤트가 호출된다")
    void deleteAttendance_success() {
        Attendance attendance = buildAttendance(AttendanceStatus.PRESENT);
        given(attendanceRepository.findById(1L)).willReturn(Optional.of(attendance));

        attendanceService.deleteAttendance(1L);

        verify(attendanceRepository).delete(attendance);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("존재하지 않는 출결 삭제 시 IllegalArgumentException 발생")
    void deleteAttendance_notFound() {
        given(attendanceRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.deleteAttendance(1L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
