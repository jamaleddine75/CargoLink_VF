package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {
    Optional<FileMetadata> findByObjectKey(String objectKey);
    List<FileMetadata> findByBucketAndUploadedAtBefore(String bucket, LocalDateTime date);
}
