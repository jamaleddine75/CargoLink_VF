package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.UpdateTimestamp;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String phone;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = true)
    private Agency agency;

    @Column(name = "registration_city")
    private String registrationCity;

    private String vehiclePlate;

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    private String licenseNumber;

    private String documents;

    // Legacy banking fields removed.
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus verificationStatus = UserStatus.PENDING;
    
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private DriverStatus status = DriverStatus.OFFLINE;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DriverAvailability availability = DriverAvailability.AVAILABLE;

    @Version
    private Long version;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private DisciplinaryStatus disciplinaryStatus = DisciplinaryStatus.ACTIVE;

    private String lastDisciplinaryReason;

    private LocalDateTime workPermissionUntil;

    @Builder.Default
    private Double rating = 4.8; // Default rating for new drivers

    @Builder.Default
    private Integer ratingCount = 0;
    
    @Builder.Default
    private Integer loyaltyPoints = 0;

    @Builder.Default
    private boolean autoAccept = false;

    @Builder.Default
    private boolean notificationsEnabled = true;

    @Builder.Default
    private boolean soundEnabled = true;

    @Builder.Default
    private boolean googleMapsEnabled = true;

    @Builder.Default
    private boolean darkMapEnabled = true;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
