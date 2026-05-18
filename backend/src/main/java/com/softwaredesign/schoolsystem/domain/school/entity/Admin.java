package com.softwaredesign.schoolsystem.domain.school.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Admin extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static Admin createAdmin(User user) {
        Admin admin = new Admin();
        admin.user = user;
        return admin;
    }

    public void assignSchool(School school) {
        this.school = school;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}
