package com.softwaredesign.schoolsystem.domain.counseling.service;

import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingCreateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingResponse;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingUpdateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.entity.Counseling;
import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.counseling.repository.CounselingRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("CounselingService 단위 테스트")
class CounselingServiceTest {

    @Mock
    private CounselingRepository counselingRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private StudentAccessGuard studentAccessGuard;

    @InjectMocks
    private CounselingService counselingService;

    private static final Long TEACHER_USER_ID = 10L;
    private static final Long STUDENT_ID = 100L;
    private static final LocalDateTime COUNSELED_AT = LocalDateTime.of(2026, 5, 1, 14, 0);

    private Teacher teacher;
    private Student student;

    @BeforeEach
    void setUp() {
        User teacherUser = org.mockito.Mockito.mock(User.class);
        lenient().when(teacherUser.getId()).thenReturn(TEACHER_USER_ID);
        lenient().when(teacherUser.getName()).thenReturn("김교사");
        User studentUser = org.mockito.Mockito.mock(User.class);
        lenient().when(studentUser.getName()).thenReturn("이학생");

        teacher = org.mockito.Mockito.mock(Teacher.class);
        lenient().when(teacher.getId()).thenReturn(1L);
        lenient().when(teacher.getUser()).thenReturn(teacherUser);
        student = org.mockito.Mockito.mock(Student.class);
        lenient().when(student.getId()).thenReturn(STUDENT_ID);
        lenient().when(student.getUser()).thenReturn(studentUser);

        // 같은 학교 격리 검증 통과용 (teacher/student 동일 학교)
        com.softwaredesign.schoolsystem.domain.school.entity.School school =
                org.mockito.Mockito.mock(com.softwaredesign.schoolsystem.domain.school.entity.School.class);
        lenient().when(school.getId()).thenReturn(1L);
        lenient().when(teacher.getSchool()).thenReturn(school);
        lenient().when(student.getSchool()).thenReturn(school);
    }

    private Counseling buildCounseling() {
        return Counseling.createCounseling(teacher, student, COUNSELED_AT, "상담 내용", "다음 계획");
    }

    private CounselingCreateRequest createRequest(Boolean shared) {
        CounselingCreateRequest req = new CounselingCreateRequest();
        ReflectionTestUtils.setField(req, "studentId", STUDENT_ID);
        ReflectionTestUtils.setField(req, "counseledAt", COUNSELED_AT);
        ReflectionTestUtils.setField(req, "content", "상담 내용");
        ReflectionTestUtils.setField(req, "nextPlan", "다음 계획");
        ReflectionTestUtils.setField(req, "isShared", shared);
        return req;
    }

    @Test
    @DisplayName("교사가 상담을 생성하면 저장되고 공유 플래그가 반영된다")
    void create_success() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.of(student));

        CounselingResponse response = counselingService.create(createRequest(true), TEACHER_USER_ID);

        assertThat(response.getContent()).isEqualTo("상담 내용");
        assertThat(response.isShared()).isTrue();
        verify(counselingRepository).save(any(Counseling.class));
    }

    @Test
    @DisplayName("교사를 찾을 수 없으면 IllegalArgumentException 발생")
    void create_teacherNotFound() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> counselingService.create(createRequest(null), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("교사");
    }

    @Test
    @DisplayName("학생을 찾을 수 없으면 IllegalArgumentException 발생")
    void create_studentNotFound() {
        given(teacherRepository.findByUserId(TEACHER_USER_ID)).willReturn(Optional.of(teacher));
        given(studentRepository.findById(STUDENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> counselingService.create(createRequest(null), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("학생");
    }

    @Test
    @DisplayName("학생별 상담 목록을 조회한다")
    void getByStudent_success() {
        given(counselingRepository.findByStudentId(STUDENT_ID)).willReturn(List.of(buildCounseling()));

        AuthUser teacher = new AuthUser(TEACHER_USER_ID, "teacher@test.com", "TEACHER");
        List<CounselingResponse> result = counselingService.getByStudent(STUDENT_ID, teacher);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("공유 상담 검색은 null 기간을 기본 범위로 대체한다")
    void searchShared_defaultsNullDates() {
        given(counselingRepository.searchShared(any(), any(), any(), any()))
                .willReturn(List.of(buildCounseling()));

        List<CounselingResponse> result = counselingService.searchShared("이학생", 1L, null, null);

        assertThat(result).hasSize(1);
        verify(counselingRepository).searchShared(any(), any(), any(), any());
    }

    @Test
    @DisplayName("작성 교사가 상담을 수정하면 내용이 갱신된다")
    void update_success() {
        Counseling counseling = buildCounseling();
        given(counselingRepository.findById(1L)).willReturn(Optional.of(counseling));
        CounselingUpdateRequest req = new CounselingUpdateRequest();
        ReflectionTestUtils.setField(req, "content", "수정된 내용");
        ReflectionTestUtils.setField(req, "isShared", true);

        CounselingResponse response = counselingService.update(1L, req, TEACHER_USER_ID);

        assertThat(response.getContent()).isEqualTo("수정된 내용");
        assertThat(response.isShared()).isTrue();
    }

    @Test
    @DisplayName("존재하지 않는 상담 수정 시 IllegalArgumentException 발생")
    void update_notFound() {
        given(counselingRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> counselingService.update(1L, new CounselingUpdateRequest(), TEACHER_USER_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("작성자가 아닌 교사가 수정하면 AccessDeniedException 발생")
    void update_notOwner() {
        Counseling counseling = buildCounseling();
        given(counselingRepository.findById(1L)).willReturn(Optional.of(counseling));

        assertThatThrownBy(() -> counselingService.update(1L, new CounselingUpdateRequest(), 999L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("작성 교사가 상담을 삭제하면 delete 가 호출된다")
    void delete_success() {
        Counseling counseling = buildCounseling();
        given(counselingRepository.findById(1L)).willReturn(Optional.of(counseling));

        counselingService.delete(1L, TEACHER_USER_ID);

        verify(counselingRepository).delete(counseling);
    }

    @Test
    @DisplayName("작성자가 아닌 교사가 삭제하면 AccessDeniedException 발생")
    void delete_notOwner() {
        Counseling counseling = buildCounseling();
        given(counselingRepository.findById(1L)).willReturn(Optional.of(counseling));

        assertThatThrownBy(() -> counselingService.delete(1L, 999L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
