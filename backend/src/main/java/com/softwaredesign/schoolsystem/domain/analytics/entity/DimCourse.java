package com.softwaredesign.schoolsystem.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "dim_course", schema = "analytics")
public class DimCourse {

    @Id
    @Column(name = "course_key")
    private Long courseKey;

    @Column(name = "course_name")
    private String courseName;

    @Column(name = "course_type")
    private String courseType;

    @Column(name = "teacher_id")
    private Long teacherId;

    @Column(name = "teacher_name")
    private String teacherName;

    @Column(name = "etl_loaded_at")
    private LocalDateTime etlLoadedAt;
}
