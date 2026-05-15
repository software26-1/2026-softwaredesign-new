package com.softwaredesign.schoolsystem.domain.academic.controller;

import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumCreateRequest;
import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumResponse;
import com.softwaredesign.schoolsystem.domain.academic.dto.CurriculumUpdateRequest;
import com.softwaredesign.schoolsystem.domain.academic.entity.Curriculum;
import com.softwaredesign.schoolsystem.domain.academic.service.CurriculumService;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/curriculums")
public class CurriculumController {

    private final CurriculumService curriculumService;

    @PostMapping
    public ResponseEntity<CurriculumResponse> createCurriculum(@RequestBody CurriculumCreateRequest request) {
        CurriculumResponse response = curriculumService.createCurriculum(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CurriculumResponse>> getCurriculums(
            @RequestParam(name = "school_type", required = false) SchoolType schoolType) {
        List<Curriculum> curriculums = curriculumService.getCurriculums(schoolType);
        List<CurriculumResponse> response = curriculums.stream()
                .map(CurriculumResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{curriculumId}")
    public ResponseEntity<CurriculumResponse> updateCurriculum(
            @PathVariable Long curriculumId,
            @RequestBody CurriculumUpdateRequest request) {
        CurriculumResponse response = curriculumService.updateCurriculum(curriculumId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{curriculumId}")
    public ResponseEntity<Map<String, String>> deleteCurriculum(@PathVariable Long curriculumId) {
        curriculumService.deleteCurriculum(curriculumId);
        return ResponseEntity.ok(Map.of("message", "삭제 완료"));
    }
}
