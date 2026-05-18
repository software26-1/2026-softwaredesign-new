package com.softwaredesign.schoolsystem.domain.user.dto;

import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import lombok.Getter;

@Getter
public class UserUpdateRequest {
    private UserRole role;
    private String name;
    private String phone;
}
