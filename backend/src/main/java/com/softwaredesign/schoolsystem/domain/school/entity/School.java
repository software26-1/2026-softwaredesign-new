package com.softwaredesign.schoolsystem.domain.school.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class School extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String schoolName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SchoolType schoolType;

    @Column(nullable = false, unique = true)
    private String schoolCode;

    @Column(nullable = false)
    private boolean isDeleted = false; // Boolean 래퍼 클래스는 nullable하다. -> DB NULL 매핑이 가능. 여기서는 nullable = false를 걸어뒀으므로, 원래 null이 안됨. 따라서 false로 선언.

    public static School createSchool(String schoolName, SchoolType schoolType, String schoolCode) {
        School school = new School();

        school.schoolName = schoolName;
        school.schoolType = schoolType;
        school.schoolCode = schoolCode;
        school.isDeleted = false;

        return school;
    }

    public void updateSchool(String schoolName, SchoolType schoolType) {
        if (schoolName != null) this.schoolName = schoolName;
        if (schoolType != null) this.schoolType = schoolType;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}
