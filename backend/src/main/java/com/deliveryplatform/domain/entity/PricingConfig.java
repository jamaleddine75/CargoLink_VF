package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "pricing_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Client Pricing (MAD)
    private java.math.BigDecimal baseDeliveryFee; 
    private java.math.BigDecimal pricePerKm;      
    private java.math.BigDecimal codHandlingFee;  
    private java.math.BigDecimal urgentDeliveryFee; 
    private java.math.BigDecimal heavyPackageFee; 

    // Driver Earnings Logic
    @Enumerated(EnumType.STRING)
    private EarningsModel earningsModel; // PERCENTAGE or DISTANCE

    private java.math.BigDecimal driverPercentage; // e.g., 0.70 for 70%
    private java.math.BigDecimal driverBaseFee;    
    private java.math.BigDecimal driverRatePerKm;  

    @Builder.Default
    private boolean active = true;

    public enum EarningsModel {
        PERCENTAGE,
        DISTANCE
    }
}
