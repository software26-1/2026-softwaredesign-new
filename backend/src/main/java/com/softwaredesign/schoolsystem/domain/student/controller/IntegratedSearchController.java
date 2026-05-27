package com.softwaredesign.schoolsystem.domain.student.controller;

import com.softwaredesign.schoolsystem.domain.student.dto.IntegratedSearchResponse;
import com.softwaredesign.schoolsystem.domain.student.service.IntegratedSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class IntegratedSearchController {

    private final IntegratedSearchService integratedSearchService;

    @GetMapping("/{studentId}/search")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<IntegratedSearchResponse> search(@PathVariable Long studentId) {
        return ResponseEntity.ok(integratedSearchService.search(studentId));
    }
}
