package com.softwaredesign.schoolsystem.domain.feedback.repository;

import com.softwaredesign.schoolsystem.domain.feedback.entity.Feedback;
import com.softwaredesign.schoolsystem.domain.feedback.entity.FeedbackType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByStudentId(Long studentId);
    List<Feedback> findByTeacherId(Long teacherId);
    List<Feedback> findByStudentIdAndType(Long studentId, FeedbackType type);
}
