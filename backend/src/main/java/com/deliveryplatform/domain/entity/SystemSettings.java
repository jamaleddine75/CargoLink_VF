package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "system_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String platformName;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String timezone;

    @Builder.Default
    private boolean maintenanceMode = false;

    @Column(nullable = false)
    private Long jwtExpiry; // In milliseconds
}
