package com.softwaredesign.schoolsystem.domain.user.controller;

import com.softwaredesign.schoolsystem.common.response.ApiResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.UserSummaryResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.UserUpdateRequest;
import com.softwaredesign.schoolsystem.domain.user.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    // 전체 사용자 목록 (status, role 필터)
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.getUsers(status, role)));
    }

    // 승인 대기 목록
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getPendingUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.getPendingUsers()));
    }

    // 승인
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> approveUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.approveUser(id)));
    }

    // 거절/비활성화
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> rejectUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.rejectUser(id)));
    }

    // 정보 수정 (role, position 등)
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.updateUser(id, request)));
    }

    // 삭제 (비활성화 처리)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userAdminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
