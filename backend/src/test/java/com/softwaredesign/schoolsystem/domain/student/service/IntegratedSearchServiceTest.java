package com.softwaredesign.schoolsystem.domain.student.service;

import com.softwaredesign.schoolsystem.domain.attendance.entity.Attendance;
import com.softwaredesign.schoolsystem.domain.attendance.entity.AttendanceStatus;
import com.softwaredesign.schoolsystem.domain.attendance.repository.AttendanceRepository;
import com.softwaredesign.schoolsystem.domain.counseling.repository.CounselingRepository;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.student.dto.IntegratedSearchResponse;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
@DisplayName("IntegratedSearchService 단위 테스트")
class IntegratedSearchServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private CounselingRepository counselingRepository;
    @Mock
    private AttendanceRepository attendanceRepository;

    @InjectMocks
    private IntegratedSearchService integratedSearchService;

    private static final Long STUDENT_ID = 100L;

    private Student student;

    @BeforeEach
    void setUp() {
        User studentUser = mock(User.class);
        lenient().when(studentUser.getName()).thenReturn("이학생");
        ClassGroup classGroup = mock(ClassGroup.class);
        lenient().when(classGroup.getGrade()).thenReturn(2);
        lenient().when(classGroup.getClassNumber()).thenReturn(3);

        student = mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);
        lenient().when(student.getClassGroup()).thenReturn(classGroup);
    }

    private Attendance attendance(AttendanceStatus status) {
        Attendance a = mock(Attendance.class);
        lenient().when(a.getStatus()).thenReturn(status);
        return a;
    }

    @Test
    @DisplayName("학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void search_studentNotFound() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> integratedSearchService.search(STUDENT_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("학생 정보와 출결 요약을 집계해 통합 응답을 반환한다")
    void search_aggregatesAttendanceSummary() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(gradeRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        given(counselingRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        Attendance present1 = attendance(AttendanceStatus.PRESENT);
        Attendance present2 = attendance(AttendanceStatus.PRESENT);
        Attendance absent = attendance(AttendanceStatus.ABSENT);
        Attendance late = attendance(AttendanceStatus.LATE);
        Attendance earlyLeave = attendance(AttendanceStatus.EARLY_LEAVE);
        given(attendanceRepository.findByStudentId(STUDENT_ID))
                .willReturn(List.of(present1, present2, absent, late, earlyLeave));

        IntegratedSearchResponse response = integratedSearchService.search(STUDENT_ID);

        assertThat(response.getStudent().getName()).isEqualTo("이학생");
        assertThat(response.getStudent().getGrade()).isEqualTo(2);
        assertThat(response.getStudent().getClassNumber()).isEqualTo(3);
        assertThat(response.getAttendanceSummary().getPresent()).isEqualTo(2);
        assertThat(response.getAttendanceSummary().getAbsent()).isEqualTo(1);
        assertThat(response.getAttendanceSummary().getLate()).isEqualTo(1);
        assertThat(response.getAttendanceSummary().getEarlyLeave()).isEqualTo(1);
        assertThat(response.getAttendanceSummary().getTotal()).isEqualTo(5);
    }

    @Test
    @DisplayName("학급이 없는 학생은 학년/반이 null 로 매핑된다")
    void search_studentWithoutClassGroup() {
        given(student.getClassGroup()).willReturn(null);
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(gradeRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        given(counselingRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());
        given(attendanceRepository.findByStudentId(STUDENT_ID)).willReturn(List.of());

        IntegratedSearchResponse response = integratedSearchService.search(STUDENT_ID);

        assertThat(response.getStudent().getGrade()).isNull();
        assertThat(response.getStudent().getClassNumber()).isNull();
        assertThat(response.getAttendanceSummary().getTotal()).isZero();
    }
}
