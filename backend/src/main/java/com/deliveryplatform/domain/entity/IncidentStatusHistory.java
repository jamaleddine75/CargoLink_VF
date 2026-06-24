package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incident_status_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID incidentId;

    @Column(nullable = false)
    private String status;

    private UUID changedBy;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
