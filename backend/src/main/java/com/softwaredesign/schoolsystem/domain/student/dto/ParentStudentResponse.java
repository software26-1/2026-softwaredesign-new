package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class ParentStudentResponse {
    private final Long id;
    private final Long parentId;
    private final Long studentId;
    private final Relationship relationship;
    private final LocalDateTime createdAt;

    public static ParentStudentResponse from(ParentStudent parentStudent) {
        return new ParentStudentResponse(
                parentStudent.getId(),
                parentStudent.getParent().getId(),
                parentStudent.getStudent().getId(),
                parentStudent.getRelationship(),
                parentStudent.getCreatedAt()
        );
    }
}
