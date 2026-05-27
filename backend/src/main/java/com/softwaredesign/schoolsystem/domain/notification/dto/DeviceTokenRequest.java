package com.softwaredesign.schoolsystem.domain.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for registering / unregistering an FCM device token.
 * {@code platform} is optional metadata (e.g. {@code "web"}, {@code "android"}).
 */
@Getter
@NoArgsConstructor
public class DeviceTokenRequest {

    @NotBlank(message = "token 은 필수입니다.")
    private String token;

    private String platform;
}
