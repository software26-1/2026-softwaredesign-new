package com.softwaredesign.schoolsystem.auth.service;

import com.softwaredesign.schoolsystem.auth.dto.AdminLoginRequest;
import com.softwaredesign.schoolsystem.auth.dto.ProfileSetupRequest;
import com.softwaredesign.schoolsystem.auth.dto.TokenResponse;
import com.softwaredesign.schoolsystem.auth.jwt.JwtProvider;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.approval.repository.ApprovalRequestRepository;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.event.ProfileSetupEvent;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Parent;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import com.softwaredesign.schoolsystem.domain.user.entity.UserStatus;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final ClassGroupRepository classGroupRepository;
    private final SchoolRepository schoolRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final NotificationService notificationService;

    // 신규 유저: 프로필 설정 완료 → WAITING_APPROVAL 상태로 변경 (승인 후 ACTIVE)
    public void setupProfile(Long userId, ProfileSetupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new IllegalStateException("이미 프로필 설정이 완료된 사용자입니다.");
        }

        user.setupProfile(request);

        switch (request.getRole()) {
            case TEACHER -> teacherRepository.save(
                    Teacher.createTeacher(user, request.getPosition()));
            case STUDENT -> {
                studentRepository.save(Student.createStudent(user, null, null, 0));
                createClassApprovalRequest(user, request, RequestType.STUDENT_REGISTRATION);
            }
            case PARENT -> {
                parentRepository.save(Parent.createParent(user));
                createClassApprovalRequest(user, request, RequestType.PARENT_REGISTRATION);
            }
            default -> {} // ADMIN은 별도 생성 플로우
        }

        eventPublisher.publishEvent(new ProfileSetupEvent(
                user.getId(), user.getName(), user.getSchoolName(),
                request.getRole().name()));
    }

    // Admin ID/Password 로그인
    @Transactional(readOnly = true)
    public TokenResponse adminLogin(AdminLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("관리자 계정이 아닙니다.");
        }
        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return issueTokens(user);
    }

    // 리프레시 토큰으로 새 액세스 토큰 발급 (rotation: 기존 리프레시 폐기 후 신규 발급)
    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        String hashedToken = jwtProvider.hashToken(refreshToken);
        String userId = redisTemplate.opsForValue().get("RT:" + hashedToken);

        if (userId == null) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 리프레시 토큰입니다.");
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 기존 토큰 삭제 후 새 토큰 발급 (Refresh Token Rotation)
        redisTemplate.delete("RT:" + hashedToken);
        redisTemplate.delete("RTU:" + user.getId());

        return issueTokens(user);
    }

    public void logout(Long userId) {
        String hashedToken = redisTemplate.opsForValue().get("RTU:" + userId);
        if (hashedToken != null) {
            redisTemplate.delete("RT:" + hashedToken);
            redisTemplate.delete("RTU:" + userId);
        }
    }

    private void createClassApprovalRequest(User user, ProfileSetupRequest request, RequestType type) {
        if (request.getGrade() == null || request.getClassNum() == null) return;
        ClassGroup classGroup = classGroupRepository
                .findBySchoolSchoolNameAndGradeAndClassNumberAndIsDeletedFalse(
                        user.getSchoolName(), request.getGrade(), request.getClassNum())
                .orElse(null);
        long classGroupId = classGroup != null ? classGroup.getId() : 0L;
        String detail = String.format("학교:%s|학년:%d|반:%d|번호:%d|classGroupId:%d",
                user.getSchoolName(),
                request.getGrade(),
                request.getClassNum(),
                request.getStudentNum() != null ? request.getStudentNum() : 0,
                classGroupId);
        approvalRequestRepository.save(ApprovalRequest.create(user, type, detail));

        // 해당 학급 담임 교사에게 가입 승인 요청 알림 발송
        if (classGroup != null && classGroup.getHomeroomTeacher() != null
                && classGroup.getHomeroomTeacher().getUser() != null) {
            boolean isStudent = type == RequestType.STUDENT_REGISTRATION;
            String who = user.getName() + (isStudent ? " 학생" : " 학부모");
            String title = isStudent ? "학생 가입 승인 요청" : "학부모 가입 승인 요청";
            notificationService.notify(classGroup.getHomeroomTeacher().getUser().getId(),
                    NotificationEventType.APPROVAL, title,
                    who + "이 학급 가입 승인을 요청했습니다. 승인 대기 목록을 확인해 주세요.");
        }
    }

    private TokenResponse issueTokens(User user) {
        String accessToken = jwtProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtProvider.createRefreshToken();
        String hashedToken = jwtProvider.hashToken(refreshToken);
        long ttl = jwtProvider.getRefreshExpiration();

        redisTemplate.opsForValue().set("RT:" + hashedToken, String.valueOf(user.getId()), Duration.ofMillis(ttl));
        redisTemplate.opsForValue().set("RTU:" + user.getId(), hashedToken, Duration.ofMillis(ttl));

        return new TokenResponse(
                accessToken, refreshToken,
                new TokenResponse.UserInfo(
                        user.getId(), user.getEmail(), user.getName(),
                        user.getRole().name(), user.getStatus().name()
                )
        );
    }
}
