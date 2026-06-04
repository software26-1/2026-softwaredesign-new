package com.softwaredesign.schoolsystem.domain.feedback.service;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackCreateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackUpdateRequest;
import com.softwaredesign.schoolsystem.domain.feedback.entity.Feedback;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import com.softwaredesign.schoolsystem.domain.academic.repository.EnrollmentRepository;
import com.softwaredesign.schoolsystem.domain.feedback.repository.FeedbackRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
import com.softwaredesign.schoolsystem.domain.student.entity.Parent;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeedbackService 단위 테스트")
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ParentStudentRepository parentStudentRepository;
    @Mock
    private ClassGroupRepository classGroupRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private StudentAccessGuard studentAccessGuard;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private FeedbackService feedbackService;

    private static final Long TEACHER_USER_ID = 10L;
    private static final Long STUDENT_USER_ID = 20L;
    private static final Long PARENT_USER_ID = 30L;
    private static final Long STUDENT_ID = 100L;

    private Teacher teacher;
    private Student student;
    private User teacherUser;
    private User studentUser;

    @BeforeEach
    void setUp() {
        teacherUser = org.mockito.Mockito.mock(User.class);
        lenient().when(teacherUser.getId()).thenReturn(TEACHER_USER_ID);
        lenient().when(teacherUser.getName()).thenReturn("김교사");

        studentUser = org.mockito.Mockito.mock(User.class);
        lenient().when(studentUser.getId()).thenReturn(STUDENT_USER_ID);
        lenient().when(studentUser.getName()).thenReturn("이학생");

        teacher = org.mockito.Mockito.mock(Teacher.class);
        lenient().when(teacher.getId()).thenReturn(1L);
        lenient().when(teacher.getUser()).thenReturn(teacherUser);

        student = org.mockito.Mockito.mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);

        // 같은 학교 격리 검증 통과용 (teacher/student 동일 학교)
        School school = org.mockito.Mockito.mock(School.class);
        lenient().when(school.getId()).thenReturn(1L);
        lenient().when(teacher.getSchool()).thenReturn(school);
        lenient().when(student.getSchool()).thenReturn(school);
    }

    private Feedback buildFeedback(boolean visibleToStudent, boolean visibleToParent) {
        return Feedback.createFeedback(teacher, student, "잘했어요", FeedbackType.ACADEMIC,
                visibleToStudent, visibleToParent);
    }

    @Test
    @DisplayName("교사가 피드백을 생성하면 저장되고 이벤트가 발행된다")
    void createFeedback_success() {
        // Arrange
        FeedbackCreateRequest request = new FeedbackCreateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(request, "studentId", STUDENT_ID);
        org.springframework.test.util.ReflectionTestUtils.setField(request, "type", FeedbackType.ACADEMIC);
        org.springframework.test.util.ReflectionTestUtils.setField(request, "content", "잘했어요");
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));
        // 성적(ACADEMIC) 피드백 권한: 해당 학생을 가르치는 교과 교사로 인정
        given(enrollmentRepository.existsByStudentIdAndCourse_Teacher_IdAndIsDeletedFalse(STUDENT_ID, 1L))
                .willReturn(true);

        // Act
        FeedbackResponse response = feedbackService.createFeedback(request, TEACHER_USER_ID);

        // Assert
        assertThat(response.getContent()).isEqualTo("잘했어요");
        assertThat(response.isVisibleToStudent()).isTrue();
        assertThat(response.isVisibleToParent()).isTrue();
        verify(feedbackRepository).save(any(Feedback.class));
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("교사를 찾을 수 없으면 IllegalArgumentException 발생")
    void createFeedback_teacherNotFound() {
        FeedbackCreateRequest request = new FeedbackCreateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(request, "studentId", STUDENT_ID);
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> feedbackService.createFeedback(request, TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("교사");
    }

    @Test
    @DisplayName("학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void createFeedback_studentNotFound() {
        FeedbackCreateRequest request = new FeedbackCreateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(request, "studentId", STUDENT_ID);
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> feedbackService.createFeedback(request, TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("TEACHER 권한은 visible 플래그와 무관하게 모든 피드백을 본다")
    void getByStudent_teacherSeesAll() {
        Feedback hidden = buildFeedback(false, false);
        Feedback visible = buildFeedback(true, true);
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(hidden, visible));
        AuthUser teacherAuth = new AuthUser(TEACHER_USER_ID, "t@x.com", "TEACHER");

        List<FeedbackResponse> result = feedbackService.getByStudent(STUDENT_ID, null, teacherAuth);

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("STUDENT 권한은 본인이며 visibleToStudent 인 피드백만 본다")
    void getByStudent_studentFiltered() {
        Feedback hidden = buildFeedback(false, true);
        Feedback visible = buildFeedback(true, true);
        given(feedbackRepository.findByStudentIdAndType(STUDENT_ID, FeedbackType.ACADEMIC))
                .willReturn(List.of(hidden, visible));
        AuthUser studentAuth = new AuthUser(STUDENT_USER_ID, "s@x.com", "STUDENT");

        List<FeedbackResponse> result =
                feedbackService.getByStudent(STUDENT_ID, FeedbackType.ACADEMIC, studentAuth);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isVisibleToStudent()).isTrue();
    }

    @Test
    @DisplayName("STUDENT 권한이 다른 학생 ID로 조회하면 결과가 비어 있다")
    void getByStudent_studentNotOwner() {
        Feedback visible = buildFeedback(true, true);
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(visible));
        AuthUser otherStudent = new AuthUser(999L, "o@x.com", "STUDENT");

        List<FeedbackResponse> result = feedbackService.getByStudent(STUDENT_ID, null, otherStudent);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("PARENT 권한은 자녀의 visibleToParent 피드백만 본다")
    void getByStudent_parentSeesChildVisible() {
        Feedback parentHidden = buildFeedback(true, false);
        Feedback parentVisible = buildFeedback(true, true);
        given(feedbackRepository.findByStudentId(STUDENT_ID))
                .willReturn(List.of(parentHidden, parentVisible));

        User parentUser = org.mockito.Mockito.mock(User.class);
        given(parentUser.getId()).willReturn(PARENT_USER_ID);
        Parent parent = org.mockito.Mockito.mock(Parent.class);
        given(parent.getUser()).willReturn(parentUser);
        ParentStudent link = org.mockito.Mockito.mock(ParentStudent.class);
        given(link.getParent()).willReturn(parent);
        given(parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(STUDENT_ID))
                .willReturn(List.of(link));
        AuthUser parentAuth = new AuthUser(PARENT_USER_ID, "p@x.com", "PARENT");

        List<FeedbackResponse> result = feedbackService.getByStudent(STUDENT_ID, null, parentAuth);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isVisibleToParent()).isTrue();
    }

    @Test
    @DisplayName("PARENT 권한이 자녀가 아니면 빈 리스트를 받는다")
    void getByStudent_parentNotMyChild() {
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(buildFeedback(true, true)));
        given(parentStudentRepository.findAllByStudentIdAndIsDeletedFalse(STUDENT_ID))
                .willReturn(List.of());
        AuthUser parentAuth = new AuthUser(PARENT_USER_ID, "p@x.com", "PARENT");

        List<FeedbackResponse> result = feedbackService.getByStudent(STUDENT_ID, null, parentAuth);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("알 수 없는 역할은 빈 리스트를 받는다")
    void getByStudent_unknownRole() {
        given(feedbackRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(buildFeedback(true, true)));
        AuthUser unknown = new AuthUser(1L, "x@x.com", "UNKNOWN");

        List<FeedbackResponse> result = feedbackService.getByStudent(STUDENT_ID, null, unknown);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("작성 교사가 피드백을 수정하면 내용이 갱신된다")
    void updateFeedback_success() {
        Feedback feedback = buildFeedback(true, true);
        given(feedbackRepository.findById(1L)).willReturn(Optional.of(feedback));
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        FeedbackUpdateRequest request = new FeedbackUpdateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(request, "content", "수정됨");

        FeedbackResponse response = feedbackService.updateFeedback(1L, request, TEACHER_USER_ID);

        assertThat(response.getContent()).isEqualTo("수정됨");
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("존재하지 않는 피드백 수정 시 IllegalArgumentException 발생")
    void updateFeedback_notFound() {
        given(feedbackRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> feedbackService.updateFeedback(1L, new FeedbackUpdateRequest(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("작성자가 아닌 교사가 수정하면 AccessDeniedException 발생")
    void updateFeedback_notOwner() {
        Feedback feedback = buildFeedback(true, true);
        given(feedbackRepository.findById(1L)).willReturn(Optional.of(feedback));

        assertThatThrownBy(() -> feedbackService.updateFeedback(1L, new FeedbackUpdateRequest(), 999L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("작성 교사가 피드백을 삭제하면 delete 와 이벤트가 호출된다")
    void deleteFeedback_success() {
        Feedback feedback = buildFeedback(true, true);
        given(feedbackRepository.findById(1L)).willReturn(Optional.of(feedback));
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));

        feedbackService.deleteFeedback(1L, TEACHER_USER_ID);

        verify(feedbackRepository).delete(feedback);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("작성자가 아닌 교사가 삭제하면 AccessDeniedException 발생")
    void deleteFeedback_notOwner() {
        Feedback feedback = buildFeedback(true, true);
        given(feedbackRepository.findById(1L)).willReturn(Optional.of(feedback));

        assertThatThrownBy(() -> feedbackService.deleteFeedback(1L, 999L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
