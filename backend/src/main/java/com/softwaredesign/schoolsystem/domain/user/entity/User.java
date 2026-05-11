package com.softwaredesign.schoolsystem.domain.user.entity;

import com.softwaredesign.schoolsystem.auth.dto.ProfileSetupRequest;
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

    // 학생: 학년/반/번호, 학부모: 자녀 학년/반/번호
    private Integer grade;
    private Integer classNum;
    private Integer studentNum;

    private String residentNumber;
    private String password;

    // 선생님: 직책(HOMEROOM/SUBJECT/NON_SUBJECT), 담임이면 담당 학년/반
    private String position;
    private Integer homeroomGrade;
    private Integer homeroomClassNum;

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

        if (req.getRole() == UserRole.STUDENT || req.getRole() == UserRole.PARENT) {
            this.grade = req.getGrade();
            this.classNum = req.getClassNum();
            this.studentNum = req.getStudentNum();
        } else if (req.getRole() == UserRole.TEACHER) {
            this.position = req.getPosition();
            if ("HOMEROOM".equals(req.getPosition())) {
                this.homeroomGrade = req.getHomeroomGrade();
                this.homeroomClassNum = req.getHomeroomClassNum();
            }
        }

        this.status = UserStatus.WAITING_APPROVAL;
    }

    public void approve() {
        this.status = UserStatus.ACTIVE;
    }

    public void reject() {
        this.status = UserStatus.INACTIVE;
    }

    public void adminUpdate(UserRole role, String name, String phone, String position) {
        if (role != null) this.role = role;
        if (name != null) this.name = name;
        if (phone != null) this.phone = phone;
        if (position != null) this.position = position;
    }
}
