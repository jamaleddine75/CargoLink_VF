package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverBadge {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    private String name;
    private String description;
    private String icon;

    @Enumerated(EnumType.STRING)
    private BadgeType badgeType;

    @Builder.Default
    private LocalDateTime earnedAt = LocalDateTime.now();
}
