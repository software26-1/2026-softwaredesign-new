package com.softwaredesign.schoolsystem.domain.record.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordCreateOrUpdateRequest;
import com.softwaredesign.schoolsystem.domain.record.dto.StudentRecordResponse;
import com.softwaredesign.schoolsystem.domain.record.entity.StudentRecord;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.record.repository.StudentRecordRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudentRecordService 단위 테스트")
class StudentRecordServiceTest {

    @Mock
    private StudentRecordRepository studentRecordRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private ClassGroupRepository classGroupRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private StudentRecordService studentRecordService;

    private static final Long TEACHER_USER_ID = 10L;
    private static final Long TEACHER_ID = 5L;
    private static final Long STUDENT_ID = 100L;

    private Student student;
    private Teacher teacher;

    @BeforeEach
    void setUp() {
        User studentUser = org.mockito.Mockito.mock(User.class);
        lenient().when(studentUser.getName()).thenReturn("이학생");
        student = org.mockito.Mockito.mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);
        teacher = org.mockito.Mockito.mock(Teacher.class);
        lenient().when(teacher.getId()).thenReturn(TEACHER_ID);
    }

    /** 해당 학생을 가르치는 교과 교사로 인정되도록 스텁(담임/교과 권한 통과). */
    private void givenSubjectTeacher() {
        given(enrollmentRepository.existsByStudentIdAndCourse_Teacher_IdAndIsDeletedFalse(STUDENT_ID, TEACHER_ID))
                .willReturn(true);
    }

    private StudentRecordCreateOrUpdateRequest request() {
        StudentRecordCreateOrUpdateRequest req = new StudentRecordCreateOrUpdateRequest();
        ReflectionTestUtils.setField(req, "achievements", "수상 내역");
        ReflectionTestUtils.setField(req, "extracurricular", "동아리");
        ReflectionTestUtils.setField(req, "volunteerHours", 20);
        ReflectionTestUtils.setField(req, "careerAspirations", "개발자");
        return req;
    }

    @Test
    @DisplayName("학생부가 존재하면 조회된다")
    void getByStudent_success() {
        StudentRecord record = StudentRecord.createStudentRecord(student, 2026, 1);
        given(studentRecordRepository.findByStudentId(STUDENT_ID)).willReturn(Optional.of(record));

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        StudentRecordResponse response = studentRecordService.getByStudent(STUDENT_ID, teacher);

        assertThat(response.getStudentId()).isEqualTo(STUDENT_ID);
        assertThat(response.getStudentName()).isEqualTo("이학생");
    }

    @Test
    @DisplayName("학생부가 없으면 null 을 반환한다")
    void getByStudent_notFound() {
        given(studentRecordRepository.findByStudentId(STUDENT_ID)).willReturn(Optional.empty());

        AuthUser teacher = new AuthUser(1L, "teacher@test.com", "TEACHER");
        StudentRecordResponse response = studentRecordService.getByStudent(STUDENT_ID, teacher);

        assertThat(response).isNull();
    }

    @Test
    @DisplayName("기존 학생부가 있으면 갱신만 하고 새로 저장하지 않는다")
    void upsert_updatesExisting() {
        StudentRecord record = StudentRecord.createStudentRecord(student, 2026, 1);
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(studentRecordRepository.findByStudentId(STUDENT_ID)).willReturn(Optional.of(record));
        givenSubjectTeacher();

        StudentRecordResponse response = studentRecordService.upsert(STUDENT_ID, request(), TEACHER_USER_ID);

        assertThat(response.getAchievements()).isEqualTo("수상 내역");
        assertThat(response.getVolunteerHours()).isEqualTo(20);
        verify(studentRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("학생부가 없으면 새로 생성 후 저장한다")
    void upsert_createsNew() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRecordRepository.findByStudentId(STUDENT_ID)).willReturn(Optional.empty());
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        given(studentRecordRepository.save(any(StudentRecord.class)))
                .willAnswer(invocation -> invocation.getArgument(0));
        givenSubjectTeacher();

        StudentRecordResponse response = studentRecordService.upsert(STUDENT_ID, request(), TEACHER_USER_ID);

        assertThat(response.getCareerAspirations()).isEqualTo("개발자");
        verify(studentRecordRepository).save(any(StudentRecord.class));
    }

    @Test
    @DisplayName("교사가 아니면 IllegalArgumentException 발생")
    void upsert_notTeacher() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> studentRecordService.upsert(STUDENT_ID, request(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("교사");
    }

    @Test
    @DisplayName("학생부 신규 생성 시 학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void upsert_studentNotFound() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> studentRecordService.upsert(STUDENT_ID, request(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }
}
