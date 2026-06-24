package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_addresses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String label; // e.g., "Home", "Office"

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    private Double lat;
    private Double lng;

    private String contactName;
    private String contactPhone;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
