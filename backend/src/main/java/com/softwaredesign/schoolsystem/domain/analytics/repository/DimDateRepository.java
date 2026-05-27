package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.DimDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface DimDateRepository extends JpaRepository<DimDate, LocalDate> {
}
