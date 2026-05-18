package com.softwaredesign.schoolsystem.domain.classgroup.dto;

import com.softwaredesign.schoolsystem.domain.classgroup.entity.ClassGroup;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class ClassGroupResponse {

    private final Long id;
    private final Long schoolId;
    private final int grade;
    private final int classNumber;
    private final int academicYear;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static ClassGroupResponse from(ClassGroup classGroup) {
        return new ClassGroupResponse(
                classGroup.getId(),
                classGroup.getSchool().getId(),
                classGroup.getGrade(),
                classGroup.getClassNumber(),
                classGroup.getAcademicYear(),
                classGroup.getCreatedAt(),
                classGroup.getUpdatedAt()
        );
    }
}
