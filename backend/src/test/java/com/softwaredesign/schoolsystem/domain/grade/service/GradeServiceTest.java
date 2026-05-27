package com.softwaredesign.schoolsystem.domain.grade.service;

import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.entity.Enrollment;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeCreateRequest;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeResponse;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeUpdateRequest;
import com.softwaredesign.schoolsystem.domain.grade.entity.Grade;
import com.softwaredesign.schoolsystem.domain.grade.entity.GradeType;
import com.softwaredesign.schoolsystem.domain.grade.repository.GradeRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("GradeService 단위 테스트")
class GradeServiceTest {

    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private GradeService gradeService;

    private static final Long TEACHER_USER_ID = 10L;
    private static final Long STUDENT_ID = 100L;
    private static final Long ENROLLMENT_ID = 200L;

    private Student student;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        User teacherUser = org.mockito.Mockito.mock(User.class);
        lenient().when(teacherUser.getId()).thenReturn(TEACHER_USER_ID);
        lenient().when(teacherUser.getName()).thenReturn("김교사");
        Teacher teacher = org.mockito.Mockito.mock(Teacher.class);
        lenient().when(teacher.getUser()).thenReturn(teacherUser);
        Course course = org.mockito.Mockito.mock(Course.class);
        lenient().when(course.getTeacher()).thenReturn(teacher);
        lenient().when(course.getCourseName()).thenReturn("수학");

        User studentUser = org.mockito.Mockito.mock(User.class);
        lenient().when(studentUser.getName()).thenReturn("이학생");
        student = org.mockito.Mockito.mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);

        enrollment = org.mockito.Mockito.mock(Enrollment.class);
        lenient().when(enrollment.getId()).thenReturn(ENROLLMENT_ID);
        lenient().when(enrollment.getCourse()).thenReturn(course);
    }

    private GradeCreateRequest createRequest() {
        GradeCreateRequest req = new GradeCreateRequest();
        ReflectionTestUtils.setField(req, "studentId", STUDENT_ID);
        ReflectionTestUtils.setField(req, "enrollmentId", ENROLLMENT_ID);
        ReflectionTestUtils.setField(req, "score", new BigDecimal("90.0"));
        ReflectionTestUtils.setField(req, "gradeType", GradeType.MIDTERM);
        return req;
    }

    private Grade buildGrade() {
        return Grade.createGrade(student, enrollment, new BigDecimal("90.0"), GradeType.MIDTERM);
    }

    @Test
    @DisplayName("담당 교사가 성적을 생성하면 저장되고 이벤트가 발행된다")
    void createGrade_success() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(enrollmentRepository.findById(ENROLLMENT_ID)).willReturn(Optional.of(enrollment));

        GradeResponse response = gradeService.createGrade(createRequest(), TEACHER_USER_ID);

        assertThat(response.getScore()).isEqualByComparingTo("90.0");
        assertThat(response.getGradeType()).isEqualTo(GradeType.MIDTERM);
        verify(gradeRepository).save(any(Grade.class));
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void createGrade_studentNotFound() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.createGrade(createRequest(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("수강 정보를 찾을 수 없으면 IllegalArgumentException 발생")
    void createGrade_enrollmentNotFound() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(enrollmentRepository.findById(ENROLLMENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.createGrade(createRequest(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("수강");
    }

    @Test
    @DisplayName("담당 교사가 아니면 AccessDeniedException 발생")
    void createGrade_notCourseTeacher() {
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(enrollmentRepository.findById(ENROLLMENT_ID)).willReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> gradeService.createGrade(createRequest(), 999L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("학생별 성적 목록을 조회한다")
    void getGradesByStudent_success() {
        given(gradeRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(buildGrade()));

        List<GradeResponse> result = gradeService.getGradesByStudent(STUDENT_ID);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("수강별 성적 목록을 조회한다")
    void getGradesByEnrollment_success() {
        given(gradeRepository.findByEnrollmentId(ENROLLMENT_ID)).willReturn(List.of(buildGrade()));

        List<GradeResponse> result = gradeService.getGradesByEnrollment(ENROLLMENT_ID);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("담당 교사가 성적을 수정하면 점수가 갱신된다")
    void updateGrade_success() {
        Grade grade = buildGrade();
        given(gradeRepository.findById(1L)).willReturn(Optional.of(grade));
        GradeUpdateRequest req = new GradeUpdateRequest();
        ReflectionTestUtils.setField(req, "score", new BigDecimal("70.0"));

        GradeResponse response = gradeService.updateGrade(1L, req, TEACHER_USER_ID);

        assertThat(response.getScore()).isEqualByComparingTo("70.0");
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("존재하지 않는 성적 수정 시 IllegalArgumentException 발생")
    void updateGrade_notFound() {
        given(gradeRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.updateGrade(1L, new GradeUpdateRequest(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("담당 교사가 아니면 성적 수정 시 AccessDeniedException 발생")
    void updateGrade_notOwner() {
        Grade grade = buildGrade();
        given(gradeRepository.findById(1L)).willReturn(Optional.of(grade));

        assertThatThrownBy(() -> gradeService.updateGrade(1L, new GradeUpdateRequest(), 999L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("담당 교사가 성적을 삭제하면 delete 와 이벤트가 호출된다")
    void deleteGrade_success() {
        Grade grade = buildGrade();
        given(gradeRepository.findById(1L)).willReturn(Optional.of(grade));

        gradeService.deleteGrade(1L, TEACHER_USER_ID);

        verify(gradeRepository).delete(grade);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("담당 교사가 아니면 성적 삭제 시 AccessDeniedException 발생")
    void deleteGrade_notOwner() {
        Grade grade = buildGrade();
        given(gradeRepository.findById(1L)).willReturn(Optional.of(grade));

        assertThatThrownBy(() -> gradeService.deleteGrade(1L, 999L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
