package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(nullable = false)
    private java.math.BigDecimal amount;

    // We'll keep the enum internally but might need String support if service uses String
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    private UUID orderId;
    
    @Column(columnDefinition = "TEXT")
    private String referenceIds; // For COD_REMIS: list of orderIds separated by comma
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status; // PENDING, COMPLETED, etc.

    @ElementCollection
    @CollectionTable(name = "transaction_metadata", joinColumns = @JoinColumn(name = "transaction_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value")
    private java.util.Map<String, String> metadata;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime date; // Changed from createdAt to date to match service

    public void setDriverId(String driverId) {
        // Helper if service tries to set driverId directly
    }
}