package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class StudentOfParentResponse {
    private final Long studentId;
    private final String studentName;
    private final Relationship relationship;

    public static StudentOfParentResponse from(ParentStudent parentStudent) {
        return new StudentOfParentResponse(
                parentStudent.getStudent().getId(),
                parentStudent.getStudent().getUser().getName(),
                parentStudent.getRelationship()
        );
    }
}
