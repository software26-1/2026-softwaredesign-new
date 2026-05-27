package com.softwaredesign.schoolsystem.domain.counseling.dto;

import com.softwaredesign.schoolsystem.domain.counseling.entity.Counseling;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class CounselingResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final Long teacherId;
    private final String teacherName;
    private final LocalDateTime counseledAt;
    private final String content;
    private final String nextPlan;
    private final boolean shared;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static CounselingResponse from(Counseling counseling) {
        return new CounselingResponse(
                counseling.getId(),
                counseling.getStudent().getId(),
                counseling.getStudent().getUser().getName(),
                counseling.getTeacher().getId(),
                counseling.getTeacher().getUser().getName(),
                counseling.getCounseledAt(),
                counseling.getContent(),
                counseling.getNextPlan(),
                counseling.isShared(),
                counseling.getCreatedAt(),
                counseling.getUpdatedAt()
        );
    }
}
