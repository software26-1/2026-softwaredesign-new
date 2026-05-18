package com.softwaredesign.schoolsystem.domain.academic.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @Enumerated(EnumType.STRING)
    private CourseType courseType;

    @Column(nullable = false)
    private String courseName;

    @Column(nullable = false)
    private int academicYear;

    @Column(nullable = false)
    private int semester;

    @Column(nullable = false)
    private int midtermRatio;

    @Column(nullable = false)
    private int finalRatio;

    @Column(nullable = false)
    private int taskRatio;

    @Column(nullable = false)
    private boolean isDeleted = false;

    public static Course createCourse(Curriculum curriculum, Teacher teacher, School school,
                                      CourseType courseType, String courseName,
                                      int academicYear, int semester,
                                      int midtermRatio, int finalRatio, int taskRatio) {
        validateRatioSum(midtermRatio, finalRatio, taskRatio);

        Course course = new Course();
        course.curriculum = curriculum;
        course.teacher = teacher;
        course.school = school;
        course.courseType = courseType;
        course.courseName = courseName;
        course.academicYear = academicYear;
        course.semester = semester;
        course.midtermRatio = midtermRatio;
        course.finalRatio = finalRatio;
        course.taskRatio = taskRatio;
        return course;
    }

    private static void validateRatioSum(int midtermRatio, int finalRatio, int taskRatio) {
        if (midtermRatio + finalRatio + taskRatio != 100) {
            throw new IllegalArgumentException(
                    "중간, 기말, 과제 점수 비율의 합은 100이 되어야 합니다. 현재 합: "
                    + (midtermRatio + finalRatio + taskRatio));
        }
    }

    public void updateCourse(String courseName, CourseType courseType,
                             Integer midtermRatio, Integer finalRatio, Integer taskRatio) {
        if (courseName != null) this.courseName = courseName;
        if (courseType != null) this.courseType = courseType;
        if (midtermRatio != null || finalRatio != null || taskRatio != null) {
            int newMid = midtermRatio != null ? midtermRatio : this.midtermRatio;
            int newFin = finalRatio != null ? finalRatio : this.finalRatio;
            int newTask = taskRatio != null ? taskRatio : this.taskRatio;
            validateRatioSum(newMid, newFin, newTask);
            this.midtermRatio = newMid;
            this.finalRatio = newFin;
            this.taskRatio = newTask;
        }
    }

    public void softDelete() { this.isDeleted = true; }
}
