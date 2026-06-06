package com.softwaredesign.schoolsystem.domain.school.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
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
    private final Long homeroomTeacherId;
    private final String teacherName;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static ClassGroupResponse from(ClassGroup classGroup) {
        Long teacherId = classGroup.getHomeroomTeacher() != null ? classGroup.getHomeroomTeacher().getId() : null;
        String teacherName = classGroup.getHomeroomTeacher() != null
                ? classGroup.getHomeroomTeacher().getUser().getName() : null;
        return new ClassGroupResponse(
                classGroup.getId(),
                classGroup.getSchool().getId(),
                classGroup.getGrade(),
                classGroup.getClassNumber(),
                classGroup.getAcademicYear(),
                teacherId,
                teacherName,
                classGroup.getCreatedAt(),
                classGroup.getUpdatedAt()
        );
    }
}
