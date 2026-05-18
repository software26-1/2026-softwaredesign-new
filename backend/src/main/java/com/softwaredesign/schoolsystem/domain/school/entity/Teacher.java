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
public class Teacher extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @Column(length = 20)
    private String position;  // HOMEROOM, SUBJECT, NON_SUBJECT

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static Teacher createTeacher(User user, String position) {
        Teacher teacher = new Teacher();
        teacher.user = user;
        teacher.position = position;
        return teacher;
    }

    public void assignSchool(School school) {
        this.school = school;
    }

    public void updatePosition(String position) {
        this.position = position;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}