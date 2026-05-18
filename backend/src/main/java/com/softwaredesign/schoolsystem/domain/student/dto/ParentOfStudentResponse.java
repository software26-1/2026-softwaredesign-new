package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ParentOfStudentResponse {
    private final Long parentId;
    private final String parentName;
    private final Relationship relationship;

    public static ParentOfStudentResponse from(ParentStudent parentStudent) {
        return new ParentOfStudentResponse(
                parentStudent.getParent().getId(),
                parentStudent.getParent().getUser().getName(),
                parentStudent.getRelationship()
        );
    }
}
