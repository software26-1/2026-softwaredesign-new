package com.softwaredesign.schoolsystem.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MyProfileUpdateRequest {

    private String name;
    private String phone;
}
