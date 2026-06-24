package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incident_attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID incidentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    private String fileName;
    private String fileType;
    private Long fileSize;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
