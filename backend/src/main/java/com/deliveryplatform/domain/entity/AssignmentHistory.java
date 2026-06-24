package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity to track order assignment and reassignment history.
 */
@Entity
@Table(name = "assignment_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId; // Reference to Order

    @Column(nullable = false)
    private UUID previousDriverId; // Previous driver (can be null for initial assignment)

    @Column(nullable = false)
    private UUID newDriverId; // New driver

    @Column(nullable = false)
    private String reason; // Reason for assignment/reassignment

    private String notes; // Additional notes

    @Column(nullable = false)
    private String assignedBy; // User who made the assignment (admin email or ID)

    private String status; // ACTIVE, CANCELLED, REVERTED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime assignedAt;

    private LocalDateTime validUntil; // When this assignment ends (if reassigned)
}
