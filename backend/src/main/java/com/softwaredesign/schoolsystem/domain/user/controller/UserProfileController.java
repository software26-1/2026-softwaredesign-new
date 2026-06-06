package com.softwaredesign.schoolsystem.domain.user.controller;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.common.response.ApiResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileUpdateRequest;
import com.softwaredesign.schoolsystem.domain.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<MyProfileResponse>> getProfile(
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getProfile(authUser.id())));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<MyProfileResponse>> updateProfile(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody MyProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateProfile(authUser.id(), request)));
    }

    @PatchMapping("/curriculum")
    public ResponseEntity<ApiResponse<Void>> updateCurriculum(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody java.util.Map<String, Long> body) {
        userProfileService.updateCurriculum(authUser.id(), body.get("curriculumId"));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
