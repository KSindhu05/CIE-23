package com.example.ia.repository;

import com.example.ia.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    Optional<SystemConfig> findByConfigKeyAndDepartment(String configKey, String department);
    List<SystemConfig> findByDepartment(String department);
}
