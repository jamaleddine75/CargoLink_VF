package com.deliveryplatform.service.impl;

import com.deliveryplatform.config.SupabaseProperties;
import com.deliveryplatform.domain.entity.FileMetadata;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseStorageService {

    private final SupabaseProperties properties;
    private final FileMetadataRepository metadataRepository;
    private final WebClient.Builder webClientBuilder;
    
    private WebClient webClient;

    @PostConstruct
    public void init() {
        this.webClient = webClientBuilder
                .baseUrl(properties.getUrl() + "/storage/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getKey())
                .defaultHeader("apikey", properties.getKey())
                .build();
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    @Transactional
    public String uploadTempFile(MultipartFile file, String folder, String documentType, UUID userId, UUID agencyId) {
        String bucket = properties.getBucket("registration-temp");
        String extension = getExtension(file.getOriginalFilename());
        String tempId = UUID.randomUUID().toString();
        String filepath = folder + "/" + tempId + extension;

        try {
            byte[] fileBytes = file.getBytes();
            String checksum = org.springframework.util.DigestUtils.md5DigestAsHex(fileBytes);
            
            webClient.post()
                    .uri("/object/{bucket}/{filepath}", bucket, filepath)
                    .contentType(MediaType.parseMediaType(file.getContentType() != null ? file.getContentType() : "application/octet-stream"))
                    .body(BodyInserters.fromResource(new ByteArrayResource(fileBytes)))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
                    
            FileMetadata metadata = FileMetadata.builder()
                .objectKey(filepath)
                .bucket(bucket)
                .provider("SUPABASE")
                .fileSize((long) fileBytes.length)
                .checksum(checksum)
                .documentType(documentType)
                .contentType(file.getContentType())
                .uploadedBy(userId)
                .agencyId(agencyId)
                .build();
            metadataRepository.save(metadata);

            return tempId + extension;
        } catch (IOException e) {
            log.error("Failed to read file", e);
            throw new BusinessException("Failed to process file upload.");
        } catch (Exception e) {
            log.error("Supabase upload failed", e);
            throw new BusinessException("Storage API error: " + e.getMessage());
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    @Transactional
    public String promoteFile(String tempFileName, String sourceFolder, String destinationBucketKey, String destinationFolder) {
        String sourceBucket = properties.getBucket("registration-temp");
        String destBucket = properties.getBucket(destinationBucketKey);
        String sourcePath = sourceFolder + "/" + tempFileName;
        String destPath = destinationFolder + "/" + tempFileName;

        try {
            // 1. Copy
            Map<String, String> copyRequest = Map.of(
                "bucketId", sourceBucket,
                "sourceKey", sourcePath,
                "destinationBucket", destBucket,
                "destinationKey", destPath
            );

            webClient.post()
                    .uri("/object/copy")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(copyRequest)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            // 2. Verify (Optional if copy succeeded, but let's check metadata or assume OK if no exception)
            // 3. Update DB Metadata
            metadataRepository.findByObjectKey(sourcePath).ifPresent(meta -> {
                meta.setObjectKey(destPath);
                meta.setBucket(destBucket);
                metadataRepository.save(meta);
            });

            // 4. Delete temporary object
            Map<String, List<String>> deleteRequest = Map.of("prefixes", List.of(sourcePath));
            webClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri("/object/{bucket}", sourceBucket)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(deleteRequest)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            return destPath;
        } catch (Exception e) {
            log.error("Failed to promote file: {}", sourcePath, e);
            throw new BusinessException("Storage API error during file promotion: " + e.getMessage());
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public Map<String, Object> generateSignedUrl(String bucketKey, String filepath) {
        String bucket = properties.getBucket(bucketKey);
        
        try {
            Map<String, Integer> request = Map.of("expiresIn", 300);
            
            @SuppressWarnings("unchecked")
            Map<String, String> response = webClient.post()
                    .uri("/object/sign/{bucket}/{filepath}", bucket, filepath)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
                    
            if (response == null || !response.containsKey("signedURL")) {
                throw new BusinessException("Failed to generate signed URL.");
            }
            
            // Supabase returns relative URL usually: /storage/v1/object/sign/...
            // Wait, standard Supabase returns full URL or path. Let's prepend base URL if needed.
            String signedUrl = response.get("signedURL");
            if (signedUrl.startsWith("/")) {
                signedUrl = properties.getUrl() + signedUrl;
            }
            
            return Map.of(
                "signedUrl", signedUrl,
                "expiresIn", 300
            );
        } catch (Exception e) {
            log.error("Failed to generate signed URL for {}", filepath, e);
            throw new BusinessException("Storage API error: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void cleanupTempStorage() {
        log.info("Starting cleanup of orphaned temp files...");
        String tempBucket = properties.getBucket("registration-temp");
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        
        List<FileMetadata> oldFiles = metadataRepository.findByBucketAndUploadedAtBefore(tempBucket, threshold);
        
        for (FileMetadata file : oldFiles) {
            try {
                Map<String, List<String>> deleteRequest = Map.of("prefixes", List.of(file.getObjectKey()));
                webClient.method(org.springframework.http.HttpMethod.DELETE)
                        .uri("/object/{bucket}", tempBucket)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(deleteRequest)
                        .retrieve()
                        .bodyToMono(Void.class)
                        .block();
                metadataRepository.delete(file);
                log.info("Cleaned up orphaned temp file: {}", file.getObjectKey());
            } catch (Exception e) {
                log.error("Failed to delete orphaned temp file: {}", file.getObjectKey(), e);
            }
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }
        return "";
    }
}
