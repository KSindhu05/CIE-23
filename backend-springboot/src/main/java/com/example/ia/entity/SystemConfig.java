package com.example.ia.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "system_config")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String configKey;

    @Column(nullable = false)
    private String configValue;

    private String department;

    public SystemConfig() {}

    public SystemConfig(String configKey, String configValue, String department) {
        this.configKey = configKey;
        this.configValue = configValue;
        this.department = department;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConfigKey() { return configKey; }
    public void setConfigKey(String configKey) { this.configKey = configKey; }

    public String getConfigValue() { return configValue; }
    public void setConfigValue(String configValue) { this.configValue = configValue; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
