package com.softwaredesign.schoolsystem.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "dim_date", schema = "analytics")
public class DimDate {

    @Id
    @Column(name = "date_key")
    private LocalDate dateKey;

    @Column(name = "year")
    private Integer year;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "month")
    private Integer month;

    @Column(name = "week_of_year")
    private Integer weekOfYear;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;
}
