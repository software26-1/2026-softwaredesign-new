package com.softwaredesign.schoolsystem.domain.student.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class ParentStudent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent")
    private Parent parent;

    public static ParentStudent createParentStudent(Student student, Parent parent) {
        ParentStudent parentStudent = new ParentStudent();

        parentStudent.student = student;
        parentStudent.parent = parent;

        return parentStudent;
    }
}
