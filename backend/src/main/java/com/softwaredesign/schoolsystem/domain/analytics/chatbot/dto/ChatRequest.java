package com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ChatRequest(
    @NotBlank String question,
    List<ChatMessage> history
) {}
