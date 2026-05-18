package com.softwaredesign.schoolsystem.domain.user.service;

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

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsers(String status, String role) {
        List<User> users;
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
        return users.stream().map(UserSummaryResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getPendingUsers() {
        return userRepository.findByStatus(UserStatus.WAITING_APPROVAL)
                .stream().map(UserSummaryResponse::new).toList();
    }

    public UserSummaryResponse approveUser(Long userId) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.WAITING_APPROVAL) {
            throw new IllegalStateException("승인 대기 상태의 사용자가 아닙니다.");
        }
        user.approve();
        return new UserSummaryResponse(user);
    }

    public UserSummaryResponse rejectUser(Long userId) {
        User user = findUser(userId);
        user.reject();
        return new UserSummaryResponse(user);
    }

    public UserSummaryResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = findUser(userId);
        user.adminUpdate(request.getRole(), request.getName(), request.getPhone());
        return new UserSummaryResponse(user);
    }

    public void deleteUser(Long userId) {
        User user = findUser(userId);
        user.reject();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
