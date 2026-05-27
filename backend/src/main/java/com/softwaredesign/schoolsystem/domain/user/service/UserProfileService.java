package com.softwaredesign.schoolsystem.domain.user.service;

import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileUpdateRequest;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public MyProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        return MyProfileResponse.from(user);
    }

    public MyProfileResponse updateProfile(Long userId, MyProfileUpdateRequest request) {
        User user = findUser(userId);
        user.updateProfile(request.getName(), request.getPhone());
        return MyProfileResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
