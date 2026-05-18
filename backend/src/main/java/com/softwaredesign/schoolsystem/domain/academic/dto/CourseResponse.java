package com.softwaredesign.schoolsystem.domain.academic.dto;

import com.softwaredesign.schoolsystem.domain.academic.entity.Course;
import com.softwaredesign.schoolsystem.domain.academic.entity.CourseType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class CourseResponse {
    private final Long id;
    private final Long curriculumId;
    private final String curriculumName;
    private final Long teacherId;
    private final String teacherName;
    private final Long schoolId;
    private final String schoolName;
    private final CourseType courseType;
    private final String courseName;
    private final int academicYear;
    private final int semester;
    private final int midtermRatio;
    private final int finalRatio;
    private final int taskRatio;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCurriculum().getId(),
                course.getCurriculum().getCurriculumName(),
                course.getTeacher().getId(),
                course.getTeacher().getUser().getName(),
                course.getSchool().getId(),
                course.getSchool().getSchoolName(),
                course.getCourseType(),
                course.getCourseName(),
                course.getAcademicYear(),
                course.getSemester(),
                course.getMidtermRatio(),
                course.getFinalRatio(),
                course.getTaskRatio(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
