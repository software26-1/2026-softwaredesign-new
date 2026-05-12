package com.softwaredesign.schoolsystem.domain.student.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParentStudent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Parent parent;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static ParentStudent createParentStudent(Student student, Parent parent) {
        ParentStudent parentStudent = new ParentStudent();

        parentStudent.student = student;
        parentStudent.parent = parent;

        return parentStudent;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}
