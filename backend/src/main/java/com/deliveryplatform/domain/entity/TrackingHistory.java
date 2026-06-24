package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tracking_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    private String status;
    private Double latitude;
    private Double longitude;
    private String photoUrl;
    private String scanValue;
    private String comment;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
// Used for displaying path in Leaflet maps