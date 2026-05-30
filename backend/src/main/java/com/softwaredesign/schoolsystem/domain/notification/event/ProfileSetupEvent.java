package com.softwaredesign.schoolsystem.domain.notification.event;

public record ProfileSetupEvent(Long userId, String userName, String schoolName, String role) {}
