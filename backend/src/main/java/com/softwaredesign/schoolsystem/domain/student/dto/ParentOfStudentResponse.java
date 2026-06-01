package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ParentOfStudentResponse {
    private final Long mappingId;
    private final Long parentId;
    private final String parentName;
    private final String parentEmail;
    private final String parentPhone;
    private final Relationship relationship;

    public static ParentOfStudentResponse from(ParentStudent ps) {
        return new ParentOfStudentResponse(
                ps.getId(),
                ps.getParent().getId(),
                ps.getParent().getUser().getName(),
                ps.getParent().getUser().getEmail(),
                ps.getParent().getUser().getPhone(),
                ps.getRelationship()
        );
    }
}
