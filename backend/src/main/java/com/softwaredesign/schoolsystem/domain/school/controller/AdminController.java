package com.softwaredesign.schoolsystem.domain.school.controller;

import com.softwaredesign.schoolsystem.domain.school.dto.AdminResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.AdminUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.Admin;
import com.softwaredesign.schoolsystem.domain.school.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admins")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminResponse>> getAdmins(
            @RequestParam(value = "school_id", required = false) Long schoolId) {
        List<Admin> admins = adminService.getAdmins(schoolId);
        List<AdminResponse> response = admins.stream()
                .map(AdminResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{adminId}")
    public ResponseEntity<AdminResponse> getAdmin(@PathVariable Long adminId) {
        AdminResponse response = adminService.getAdmin(adminId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{adminId}")
    public ResponseEntity<AdminResponse> updateAdmin(
            @PathVariable Long adminId,
            @RequestBody AdminUpdateRequest request) {
        AdminResponse response = adminService.updateAdmin(adminId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{adminId}")
    public ResponseEntity<Map<String, String>> deleteAdmin(@PathVariable Long adminId) {
        adminService.deleteAdmin(adminId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
