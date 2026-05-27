package com.softwaredesign.schoolsystem.domain.analytics.repository;

import com.softwaredesign.schoolsystem.domain.analytics.entity.EtlJobLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EtlJobLogRepository extends JpaRepository<EtlJobLog, Long> {
}
