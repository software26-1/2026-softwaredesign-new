package com.softwaredesign.schoolsystem.domain.grade.dto;

import com.softwaredesign.schoolsystem.domain.grade.entity.GradeSummary;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class GradeSummaryResponse {
    private final Long id;
    private final Long studentId;
    private final String studentName;
    private final Long classGroupId;
    private final int year;
    private final int semester;
    private final BigDecimal averageScore;
    private final Integer rank;
    private final LocalDateTime updatedAt;

    public static GradeSummaryResponse from(GradeSummary gs) {
        return new GradeSummaryResponse(
                gs.getId(),
                gs.getStudent().getId(),
                gs.getStudent().getUser().getName(),
                gs.getClassGroup().getId(),
                gs.getYear(),
                gs.getSemester(),
                gs.getAverageScore(),
                gs.getRank(),
                gs.getUpdatedAt()
        );
    }
}
