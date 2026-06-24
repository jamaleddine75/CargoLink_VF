package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_disciplinary_actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDisciplinaryAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id", nullable = false)
    private User performedBy;

    @Enumerated(EnumType.STRING)
    private DisciplinaryStatus previousStatus;

    @Enumerated(EnumType.STRING)
    private DisciplinaryStatus newStatus;

    private String action; // SUSPEND, REACTIVATE, BLACKLIST

    @Column(nullable = false, length = 500)
    private String reason;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
