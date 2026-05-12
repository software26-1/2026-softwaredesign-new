package com.softwaredesign.schoolsystem.auth.dto;

import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ProfileSetupRequest {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    private String phone;

    private String residentNumber;

    @NotNull(message = "역할 선택은 필수입니다.")
    private UserRole role;

    @NotBlank(message = "학교명은 필수입니다.")
    private String schoolName;

    private String position;
}
