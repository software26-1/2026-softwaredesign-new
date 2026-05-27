package com.softwaredesign.schoolsystem.domain.analytics.chatbot;

import com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto.ChatRequest;
import com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    // TODO: scope STUDENT/PARENT callers to their own (or child's) student id
    //       instead of a plain role gate, and add a Redis-backed per-student
    //       rate limit to bound Claude API cost.
    @PostMapping("/students/{studentId}/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ChatResponse> chat(
            @PathVariable Long studentId,
            @Valid @RequestBody ChatRequest request) {
        String answer = chatbotService.chat(studentId, request.question());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}
