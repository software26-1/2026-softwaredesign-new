package com.softwaredesign.schoolsystem.domain.classgroup.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class ClassGroup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(nullable = false)
    private int grade;

    @Column(nullable = false)
    private int classNumber;

    @Column(nullable = false)
    private int academicYear;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static ClassGroup createClassGroup(School school, int grade, int classNumber, int academicYear) {
        ClassGroup classGroup = new ClassGroup();

        classGroup.school = school;
        classGroup.grade = grade;
        classGroup.classNumber = classNumber;
        classGroup.academicYear = academicYear;

        return classGroup;
    }

    public void updateClassGroup(Integer grade, Integer classNumber) { // wrapper 클래스 -> null 허용
        if (grade != null) this.grade = grade;
        if (classNumber != null) this.classNumber = classNumber;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}
