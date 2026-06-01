package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class StudentOfParentResponse {
    private final Long studentId;
    private final String studentName;
    private final Relationship relationship;
    private final Integer grade;
    private final Integer classNumber;
    private final Integer studentNumber;

    public static StudentOfParentResponse from(ParentStudent parentStudent) {
        Student student = parentStudent.getStudent();
        ClassGroup cg = student.getClassGroup();
        return new StudentOfParentResponse(
                student.getId(),
                student.getUser().getName(),
                parentStudent.getRelationship(),
                cg != null ? cg.getGrade() : null,
                cg != null ? cg.getClassNumber() : null,
                student.getStudentNumber()
        );
    }
}
