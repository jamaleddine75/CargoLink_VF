package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "client_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String companyName;
    private String billingAddress;
    private String taxId;
}