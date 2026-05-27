package com.softwaredesign.schoolsystem.domain.feedback.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Feedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private FeedbackType type;

    @Column(nullable = false)
    private boolean visibleToStudent = true;

    @Column(nullable = false)
    private boolean visibleToParent = true;

    public static Feedback createFeedback(Teacher teacher, Student student, String content,
                                           FeedbackType type, boolean visibleToStudent, boolean visibleToParent) {
        Feedback feedback = new Feedback();
        feedback.teacher = teacher;
        feedback.student = student;
        feedback.content = content;
        feedback.type = type;
        feedback.visibleToStudent = visibleToStudent;
        feedback.visibleToParent = visibleToParent;
        return feedback;
    }

    public void updateFeedback(String content, FeedbackType type, Boolean visibleToStudent, Boolean visibleToParent) {
        if (content != null) this.content = content;
        if (type != null) this.type = type;
        if (visibleToStudent != null) this.visibleToStudent = visibleToStudent;
        if (visibleToParent != null) this.visibleToParent = visibleToParent;
    }
}
