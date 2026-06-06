package com.softwaredesign.schoolsystem.domain.counseling.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Counseling extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "counseled_at", nullable = false)
    private LocalDateTime counseledAt;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String nextPlan;

    @Column(nullable = false)
    private boolean isShared = false;

    public static Counseling createCounseling(Teacher teacher, Student student,
                                               LocalDateTime counseledAt, String content, String nextPlan) {
        Counseling counseling = new Counseling();
        counseling.teacher = teacher;
        counseling.student = student;
        counseling.counseledAt = counseledAt;
        counseling.content = content;
        counseling.nextPlan = nextPlan;
        return counseling;
    }

    public void updateCounseling(LocalDateTime counseledAt, String content, String nextPlan) {
        if (counseledAt != null) this.counseledAt = counseledAt;
        if (content != null) this.content = content;
        if (nextPlan != null) this.nextPlan = nextPlan;
    }

    public void toggleShared() {
        this.isShared = !this.isShared;
    }

    public void setShared(boolean shared) {
        this.isShared = shared;
    }
}
