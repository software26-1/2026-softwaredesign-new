package com.softwaredesign.schoolsystem.domain.student.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Student extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id") // 전학 처리: 학교가 null인 학생을 식별하여 학교를 할당하면 전학을 한 것으로 확인
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_group_id")
    private ClassGroup classGroup;

    @Column(nullable = false)
    private int studentNumber;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public void softDelete() {
        this.isDeleted = true;
    }

    public void updateStudent(ClassGroup classGroup, Integer studentNumber) {
        if (classGroup != null) this.classGroup = classGroup;
        if (studentNumber != null) this.studentNumber = studentNumber;
    }

    public void assignSchool(School school) {
        this.school = school;
    }

    public void transferToSchool() {
        this.classGroup = null;
        this.studentNumber = 0;
    }

    public static Student createStudent(User user, School school, ClassGroup classGroup, int studentNumber) {
        Student student = new Student();

        student.user = user;
        student.school = school;
        student.classGroup = classGroup;
        student.studentNumber = studentNumber;

        return student;
    }
}
