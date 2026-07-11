package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {
    
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String objectKey;

    @Column(nullable = false)
    private String bucket;

    @Column(nullable = false)
    private String provider; // e.g. "SUPABASE"

    private Long fileSize;

    private String checksum;

    private UUID uploadedBy;

    private UUID agencyId;

    private String documentType;

    private String contentType;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
