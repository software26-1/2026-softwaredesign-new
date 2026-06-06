package com.softwaredesign.schoolsystem.domain.school.dto;

import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class TeacherResponse {
    private final Long id;
    private final Long userId;
    private final String name;
    private final String email;
    private final Long schoolId;
    private final String schoolName;
    private final String position;
    private final Long curriculumId;
    private final LocalDateTime createdAt;

    public static TeacherResponse from(Teacher teacher) {
        return new TeacherResponse(
                teacher.getId(),
                teacher.getUser().getId(),
                teacher.getUser().getName(),
                teacher.getUser().getEmail(),
                teacher.getSchool() != null ? teacher.getSchool().getId() : null,
                teacher.getSchool() != null ? teacher.getSchool().getSchoolName() : null,
                teacher.getPosition(),
                teacher.getCurriculumId(),
                teacher.getCreatedAt()
        );
    }
}
