package com.softwaredesign.schoolsystem.domain.student.dto;

import com.softwaredesign.schoolsystem.domain.attendance.dto.AttendanceSummaryResponse;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingResponse;
import com.softwaredesign.schoolsystem.domain.feedback.dto.FeedbackResponse;
import com.softwaredesign.schoolsystem.domain.grade.dto.GradeResponse;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Getter
@RequiredArgsConstructor
public class IntegratedSearchResponse {

    private final StudentInfo student;
    private final List<GradeResponse> grades;
    private final List<FeedbackResponse> feedbacks;
    private final List<CounselingResponse> counselings;
    private final AttendanceSummaryResponse attendanceSummary;

    @Getter
    @RequiredArgsConstructor
    public static class StudentInfo {
        private final Long id;
        private final String name;
        private final Integer grade;
        private final Integer classNumber;

        public static StudentInfo from(Student student) {
            return new StudentInfo(
                    student.getId(),
                    student.getUser().getName(),
                    student.getClassGroup() != null ? student.getClassGroup().getGrade() : null,
                    student.getClassGroup() != null ? student.getClassGroup().getClassNumber() : null
            );
        }
    }
}
