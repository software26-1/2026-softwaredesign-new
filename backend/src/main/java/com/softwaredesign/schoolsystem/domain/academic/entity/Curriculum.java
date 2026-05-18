package com.softwaredesign.schoolsystem.domain.academic.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.SchoolType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 지연 로딩 기능 구현 시 프록시 객체 생성이 필요한데, 프록시 객체가 상속을 통해서 만들어짐.
public class Curriculum extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String curriculumName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SchoolType schoolType;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static Curriculum createCurriculum(String curriculumName, SchoolType schoolType) {
        Curriculum curriculum = new Curriculum();

        curriculum.curriculumName = curriculumName;
        curriculum.schoolType = schoolType;

        return curriculum;
    }

    public void updateCurriculum(String curriculumName, SchoolType schoolType) {
        if (curriculumName != null) this.curriculumName = curriculumName;
        if (schoolType != null) this.schoolType = schoolType;
    }

    public void softDelete() { this.isDeleted = true; }
}
