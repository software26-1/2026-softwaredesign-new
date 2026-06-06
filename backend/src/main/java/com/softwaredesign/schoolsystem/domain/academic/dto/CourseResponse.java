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
    private final Integer grade;
    private final String evaluationType;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCurriculum() != null ? course.getCurriculum().getId() : null,
                course.getCurriculum() != null ? course.getCurriculum().getCurriculumName() : null,
                course.getTeacher() != null ? course.getTeacher().getId() : null,
                course.getTeacher() != null ? course.getTeacher().getUser().getName() : null,
                course.getSchool() != null ? course.getSchool().getId() : null,
                course.getSchool() != null ? course.getSchool().getSchoolName() : null,
                course.getCourseType(),
                course.getCourseName(),
                course.getAcademicYear(),
                course.getSemester(),
                course.getMidtermRatio(),
                course.getFinalRatio(),
                course.getTaskRatio(),
                course.getGrade(),
                course.getEvaluationType(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
