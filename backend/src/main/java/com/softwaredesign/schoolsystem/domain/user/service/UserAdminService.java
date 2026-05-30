package com.softwaredesign.schoolsystem.domain.user.service;

import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.user.dto.UserSummaryResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.UserUpdateRequest;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import com.softwaredesign.schoolsystem.domain.user.entity.UserStatus;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserAdminService {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsers(String status, String role, String schoolName) {
        List<User> users;
        if (schoolName != null) {
            // 학교 관리자 뷰: 교사만 표시 (role 파라미터 무시, ADMIN 제외)
            if (status != null) {
                users = userRepository.findBySchoolNameAndStatusAndRole(
                        schoolName, UserStatus.valueOf(status), UserRole.TEACHER);
            } else {
                users = userRepository.findBySchoolNameAndRole(schoolName, UserRole.TEACHER);
            }
        } else {
            if (status != null && role != null) {
                users = userRepository.findByStatusAndRole(
                        UserStatus.valueOf(status), UserRole.valueOf(role));
            } else if (status != null) {
                users = userRepository.findByStatus(UserStatus.valueOf(status));
            } else if (role != null) {
                users = userRepository.findByRole(UserRole.valueOf(role));
            } else {
                users = userRepository.findAll();
            }
            // 항상 ADMIN 계정 제외
            users = users.stream().filter(u -> u.getRole() != UserRole.ADMIN).toList();
        }
        return users.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getPendingUsers(String schoolName) {
        List<User> users = schoolName != null
                // 학교 관리자: 승인 대기 교사만
                ? userRepository.findBySchoolNameAndStatusAndRole(
                        schoolName, UserStatus.WAITING_APPROVAL, UserRole.TEACHER)
                : userRepository.findByStatus(UserStatus.WAITING_APPROVAL).stream()
                        .filter(u -> u.getRole() != UserRole.ADMIN).toList();
        return users.stream().map(this::toResponse).toList();
    }

    public UserSummaryResponse approveUser(Long userId) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.WAITING_APPROVAL) {
            throw new IllegalStateException("승인 대기 상태의 사용자가 아닙니다.");
        }
        user.approve();
        return toResponse(user);
    }

    public UserSummaryResponse rejectUser(Long userId) {
        User user = findUser(userId);
        user.reject();
        return toResponse(user);
    }

    public UserSummaryResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = findUser(userId);
        user.adminUpdate(request.getRole(), request.getName(), request.getPhone());
        return toResponse(user);
    }

    public void deleteUser(Long userId) {
        User user = findUser(userId);
        user.reject();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private UserSummaryResponse toResponse(User user) {
        String position = null;
        if (user.getRole() == UserRole.TEACHER) {
            position = teacherRepository.findByUserId(user.getId())
                    .map(t -> t.getPosition())
                    .orElse(null);
        }
        return new UserSummaryResponse(user, position);
    }
}
