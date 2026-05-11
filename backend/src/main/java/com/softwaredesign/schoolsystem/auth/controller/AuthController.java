package com.softwaredesign.schoolsystem.auth.controller;

import com.softwaredesign.schoolsystem.auth.dto.AdminLoginRequest;
import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.auth.dto.ProfileSetupRequest;
import com.softwaredesign.schoolsystem.auth.dto.RefreshRequest;
import com.softwaredesign.schoolsystem.auth.dto.TokenResponse;
import com.softwaredesign.schoolsystem.auth.service.AuthService;
import com.softwaredesign.schoolsystem.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 신규 유저: 임시 JWT로 인증 후 프로필 설정 → WAITING_APPROVAL 상태로 변경
    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> setupProfile(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody ProfileSetupRequest request
    ) {
        authService.setupProfile(authUser.id(), request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // Admin ID/Password 로그인
    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<TokenResponse>> adminLogin(
            @Valid @RequestBody AdminLoginRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(authService.adminLogin(request)));
    }

    // 리프레시 토큰으로 액세스 토큰 재발급
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(request.getRefreshToken())));
    }

    // 로그아웃: Redis에서 리프레시 토큰 삭제
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal AuthUser authUser
    ) {
        authService.logout(authUser.id());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
