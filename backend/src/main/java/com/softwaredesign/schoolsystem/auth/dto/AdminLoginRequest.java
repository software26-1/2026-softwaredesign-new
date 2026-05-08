package com.softwaredesign.schoolsystem.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class AdminLoginRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
