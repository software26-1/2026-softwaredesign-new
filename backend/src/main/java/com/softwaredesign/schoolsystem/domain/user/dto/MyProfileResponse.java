package com.softwaredesign.schoolsystem.domain.user.dto;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MyProfileResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final String role;
    private final String status;
    private final Long schoolId;
    private final String schoolName;
    private final LocalDateTime createdAt;
    private final Long classGroupId;
    private final String classGroupName;
    private final Integer grade;
    private final Integer classNumber;
    private final Integer studentNumber;
    private final Long studentId;
    private final Long curriculumId;
    private final String position;

    private MyProfileResponse(User user, Long schoolId, Long classGroupId, String classGroupName, Integer grade, Integer classNumber, Integer studentNumber, Long studentId, Long curriculumId, String position) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phone = user.getPhone();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.status = user.getStatus().name();
        this.schoolId = schoolId;
        this.schoolName = user.getSchoolName();
        this.createdAt = user.getCreatedAt();
        this.classGroupId = classGroupId;
        this.classGroupName = classGroupName;
        this.grade = grade;
        this.classNumber = classNumber;
        this.studentNumber = studentNumber;
        this.studentId = studentId;
        this.curriculumId = curriculumId;
        this.position = position;
    }

    public static MyProfileResponse from(User user) {
        return new MyProfileResponse(user, null, null, null, null, null, null, null, null, null);
    }

    public static MyProfileResponse from(User user, Long schoolId, Long classGroupId, Integer grade, Integer classNumber, Long curriculumId, String position) {
        String name = grade != null && classNumber != null ? grade + "학년 " + classNumber + "반" : null;
        return new MyProfileResponse(user, schoolId, classGroupId, name, grade, classNumber, null, null, curriculumId, position);
    }

    public static MyProfileResponse fromTeacher(User user, Long schoolId, Long curriculumId, String position) {
        return new MyProfileResponse(user, schoolId, null, null, null, null, null, null, curriculumId, position);
    }

    public static MyProfileResponse fromStudent(User user, Long studentId) {
        return new MyProfileResponse(user, null, null, null, null, null, null, studentId, null, null);
    }

    public static MyProfileResponse fromStudent(User user, Long studentId, Long schoolId, Long classGroupId,
                                                Integer grade, Integer classNumber, Integer studentNumber) {
        String name = grade != null && classNumber != null ? grade + "학년 " + classNumber + "반" : null;
        return new MyProfileResponse(user, schoolId, classGroupId, name, grade, classNumber, studentNumber, studentId, null, null);
    }
}
