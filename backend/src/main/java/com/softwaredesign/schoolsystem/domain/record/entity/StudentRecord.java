package com.softwaredesign.schoolsystem.domain.record.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private Student student;

    @Column(name = "academic_year", nullable = false)
    private int academicYear;

    @Column(nullable = false)
    private int semester;

    @Column(columnDefinition = "TEXT")
    private String achievements;

    @Column(columnDefinition = "TEXT")
    private String extracurricular;

    @Column(nullable = false)
    private int volunteerHours = 0;

    @Column(columnDefinition = "TEXT")
    private String careerAspirations;

    public static StudentRecord createStudentRecord(Student student, int academicYear, int semester) {
        StudentRecord record = new StudentRecord();
        record.student = student;
        record.academicYear = academicYear;
        record.semester = semester;
        return record;
    }

    public void updateTerm(int academicYear, int semester) {
        this.academicYear = academicYear;
        this.semester = semester;
    }

    public void updateStudentRecord(String achievements, String extracurricular,
                                     Integer volunteerHours, String careerAspirations) {
        if (achievements != null) this.achievements = achievements;
        if (extracurricular != null) this.extracurricular = extracurricular;
        if (volunteerHours != null) this.volunteerHours = volunteerHours;
        if (careerAspirations != null) this.careerAspirations = careerAspirations;
    }
}
