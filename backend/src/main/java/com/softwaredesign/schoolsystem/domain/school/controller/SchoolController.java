package com.softwaredesign.schoolsystem.domain.school.controller;


import com.softwaredesign.schoolsystem.domain.school.dto.SchoolCreateRequest;
import com.softwaredesign.schoolsystem.domain.school.dto.SchoolResponse;
import com.softwaredesign.schoolsystem.domain.school.dto.SchoolUpdateRequest;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import com.softwaredesign.schoolsystem.domain.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    // POST /api/schools
    @PostMapping
    public ResponseEntity<SchoolResponse> createSchool(@RequestBody SchoolCreateRequest request) {
        SchoolResponse response = schoolService.createSchool(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET /api/schools?school_type=
    @GetMapping
    public ResponseEntity<List<SchoolResponse>> getSchools(
            @RequestParam(value = "school_type", required = false)SchoolType schoolType) {
        List<School> schools = schoolService.getSchools(schoolType);
        List<SchoolResponse> response = schools.stream()
                .map(SchoolResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    // PATCH /api/achools/{schoolId}
    @PatchMapping("/{schoolId}")
    public ResponseEntity<SchoolResponse> updateSchool(
            @PathVariable Long schoolId,
            @RequestBody SchoolUpdateRequest request) { // @RequestBody 처리하면 자동으로 JSON 파싱해서 dto 매핑해줌
        SchoolResponse response = schoolService.updateSchool(schoolId, request);
        return ResponseEntity.ok(response);
    }

    // DELETE /api/achools/{schoolId}
    @DeleteMapping("/{schoolId}")
    public ResponseEntity<Map<String, String>> deleteSchool(@PathVariable Long schoolId) {
        schoolService.deleteSchool(schoolId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
