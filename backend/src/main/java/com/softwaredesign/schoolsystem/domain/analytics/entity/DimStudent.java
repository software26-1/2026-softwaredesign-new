package com.softwaredesign.schoolsystem.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "dim_student", schema = "analytics")
public class DimStudent {

    @Id
    @Column(name = "student_key")
    private Long studentKey;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "class_group_id")
    private Long classGroupId;

    @Column(name = "class_name")
    private String className;

    @Column(name = "grade_level")
    private Integer gradeLevel;

    @Column(name = "school_id")
    private Long schoolId;

    @Column(name = "etl_loaded_at")
    private LocalDateTime etlLoadedAt;
}
