package com.deliveryplatform.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/public/registration")
@RequiredArgsConstructor
@Slf4j
public class RegistrationUploadController {

    @Value("${app.storage.path:uploads}")
    private String storagePath;

    // Allowed document types strictly limited to the four requested
    private static final Set<String> ALLOWED_TYPES = Set.of("idFront", "idBack", "drivingLicense", "selfie");

    // Allowed MIME types and extensions
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".pdf");

    // Simple in-memory rate limiting (IP-based)
    private final ConcurrentHashMap<String, UploadAttempt> rateLimiter = new ConcurrentHashMap<>();
    private static final int MAX_UPLOADS_PER_HOUR = 20;

    static class UploadAttempt {
        int count;
        long timestamp;
        UploadAttempt() {
            this.count = 1;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private final com.deliveryplatform.service.impl.SupabaseStorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadTempDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String documentType,
            jakarta.servlet.http.HttpServletRequest request) {

        // 1. Rate Limiting
        String clientIp = request.getRemoteAddr();
        long now = System.currentTimeMillis();
        rateLimiter.compute(clientIp, (ip, attempt) -> {
            if (attempt == null || (now - attempt.timestamp) > 3600000) {
                return new UploadAttempt();
            }
            attempt.count++;
            return attempt;
        });

        if (rateLimiter.get(clientIp).count > MAX_UPLOADS_PER_HOUR) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", "Rate limit exceeded. Try again later."));
        }

        // 2. Validate Document Type
        if (!ALLOWED_TYPES.contains(documentType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid document type. Allowed types: " + ALLOWED_TYPES));
        }

        // 3. Validate File Existence
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
        }

        // 4. Validate MIME Type and Extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
        }
        
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file extension"));
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid MIME type"));
        }

        // 5. Upload to Supabase Storage temp bucket
        try {
            // Using "driver" as default folder for temp since we don't know the exact role yet, 
            // or we could use "guest" or "registration". Let's use "registration".
            String tempId = storageService.uploadTempFile(file, "registration", documentType, null, null);
            log.info("Saved temp file {} for type {}", tempId, documentType);

            // 6. Return only the temporary identifier
            return ResponseEntity.ok(Map.of("tempFileId", tempId));
        } catch (Exception ex) {
            log.error("Could not store temporary file", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }
}
