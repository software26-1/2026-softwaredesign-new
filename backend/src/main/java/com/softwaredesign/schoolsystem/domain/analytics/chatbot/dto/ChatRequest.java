package com.softwaredesign.schoolsystem.domain.analytics.chatbot.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(@NotBlank String question) {
}
