package com.softwaredesign.schoolsystem.domain.user.entity;

import com.softwaredesign.schoolsystem.auth.dto.ProfileSetupRequest;
import com.softwaredesign.schoolsystem.common.encryption.AesEncryptionConverter;
import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String googleId;

    private String name;
    private String phone;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    private String schoolName;

    @Convert(converter = AesEncryptionConverter.class)
    private String residentNumber;
    private String password;

    public static User createNewUser(String email, String googleId) {
        User user = new User();
        user.email = email;
        user.googleId = googleId;
        user.status = UserStatus.PENDING;
        return user;
    }

    public void linkGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public void setupProfile(ProfileSetupRequest req) {
        this.name = req.getName();
        this.phone = req.getPhone();
        this.residentNumber = req.getResidentNumber();
        this.role = req.getRole();
        this.schoolName = req.getSchoolName();
        this.status = UserStatus.WAITING_APPROVAL;
    }

    public void approve() {
        this.status = UserStatus.ACTIVE;
    }

    public void reject() {
        this.status = UserStatus.INACTIVE;
    }

    public void adminUpdate(UserRole role, String name, String phone) {
        if (role != null) this.role = role;
        if (name != null) this.name = name;
        if (phone != null) this.phone = phone;
    }

    public void updateProfile(String name, String phone) {
        if (name != null && !name.isBlank()) this.name = name;
        if (phone != null && !phone.isBlank()) this.phone = phone;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }
}
