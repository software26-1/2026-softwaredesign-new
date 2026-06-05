package com.softwaredesign.schoolsystem.domain.analytics.chatbot;

import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto.ChatRequest;
import com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto.ChatResponse;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final StudentAccessGuard studentAccessGuard;

    @PostMapping("/students/{studentId}/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long studentId,
            @Valid @RequestBody ChatRequest request) {
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        String answer = chatbotService.chat(studentId, request.question(), request.history(), authUser.role());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}
