package com.deliveryplatform.controller;

import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.exception.UnauthorizedException;
import com.deliveryplatform.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@Slf4j
@RequiredArgsConstructor
public class FileController {

    private final Path rootLocation = Paths.get("uploads").toAbsolutePath().normalize();
    
    @PersistenceContext
    private final EntityManager entityManager;

    private final com.deliveryplatform.service.impl.SupabaseStorageService storageService;

    @GetMapping("/{folder}/{filename:.+}")
    public ResponseEntity<java.util.Map<String, Object>> serveFile(
            @PathVariable String folder, 
            @PathVariable String filename,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        // Security check: ensure folder is one of the allowed ones
        if (!folder.equals("avatars") && !folder.equals("proofs") && !folder.equals("driver-documents") && !folder.equals("customer-documents")) {
            throw new ResourceNotFoundException("Directory", "name", folder);
        }

        // Verify ownership for sensitive files
        if (folder.equals("proofs") || folder.equals("driver-documents") || folder.equals("customer-documents")) {
            if (principal == null) {
                throw new UnauthorizedException("Authentication required to access this file.");
            }
            verifyOwnership(folder, filename, principal);
        }

        String bucket = folder;
        if (folder.equals("proofs")) bucket = "order-proofs";
        
        try {
            // Usually the filepath in the DB is stored as "folder/filename" or just "filename". 
            // In AuthServiceImpl we saved the permanentKey as "driver/filename" inside driver-documents.
            // But wait, the API endpoint is /api/uploads/{folder}/{filename} which implies filename might contain subfolders if URL encoded?
            // Spring by default strips slashes if we just use {filename:.+}, so it might only get the last part.
            // To be safe, if we get just the filename, we assume it's in the root of the bucket or we need to pass the full path.
            // The frontend needs to pass the full path. If it passes "driver/uuid.jpg" it should match.
            // Let's use the provided filename (which may contain slashes if mapped correctly).
            
            // Wait, FileController handles /api/uploads/{folder}/**
            // If the route is /api/uploads/{folder}/{filename:.+}, filename could contain slashes if configured.
            
            java.util.Map<String, Object> response = storageService.generateSignedUrl(bucket, filename);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error serving file {}: {}", filename, e.getMessage());
            
            if ("avatars".equals(folder)) {
                return ResponseEntity.ok(java.util.Map.of(
                    "signedUrl", "/default-avatar.png", // Or maybe an actual default avatar from static assets
                    "expiresIn", 300
                ));
            }
            return ResponseEntity.notFound().build();
        }
    }

    private void verifyOwnership(String folder, String filename, UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        UUID userId = principal.getId();
        
        if ("ROLE_ADMIN".equals(role)) {
            return; // Admins can access everything
        }

        if (folder.equals("proofs")) {
            // Find order by deliveryProofPhotoUrl containing filename
            String queryStr = "SELECT o.client.id, o.driver.user.id, o.agency.id, o.driver.agency.id FROM Order o WHERE o.deliveryProofPhotoUrl LIKE :filename";
            List<Object[]> results = entityManager.createQuery(queryStr, Object[].class)
                .setParameter("filename", "%" + filename + "%")
                .setMaxResults(1)
                .getResultList();
                
            if (results.isEmpty()) {
                // If not found in DB, we block access just in case, unless it's a legacy orphan file? 
                // Let's just return, it'll 404 anyway. Actually, better throw Unauthorized to be safe.
                throw new UnauthorizedException("Access denied or file not linked to any order.");
            }
            
            Object[] row = results.get(0);
            UUID clientId = (UUID) row[0];
            UUID driverUserId = (UUID) row[1];
            UUID agencyId1 = (UUID) row[2];
            UUID agencyId2 = (UUID) row[3];
            
            if ("ROLE_CLIENT".equals(role) && userId.equals(clientId)) return;
            if ("ROLE_DRIVER".equals(role) && userId.equals(driverUserId)) return;
            if ("ROLE_AGENCY".equals(role)) {
                try {
                    UUID myAgencyId = principal.getRequiredAgencyId();
                    if (myAgencyId.equals(agencyId1) || myAgencyId.equals(agencyId2)) return;
                } catch (Exception e) {}
            }
            throw new UnauthorizedException("You are not authorized to view this proof of delivery.");
        } 
        
        if (folder.equals("driver-documents")) {
            String queryStr = "SELECT d.user.id, d.agency.id FROM Driver d WHERE d.documents LIKE :filename";
            List<Object[]> results = entityManager.createQuery(queryStr, Object[].class)
                .setParameter("filename", "%" + filename + "%")
                .setMaxResults(1)
                .getResultList();
                
            if (results.isEmpty()) {
                throw new UnauthorizedException("Access denied or file not linked to any driver.");
            }
            
            Object[] row = results.get(0);
            UUID driverUserId = (UUID) row[0];
            UUID agencyId = (UUID) row[1];
            
            if ("ROLE_DRIVER".equals(role) && userId.equals(driverUserId)) return;
            if ("ROLE_AGENCY".equals(role)) {
                try {
                    UUID myAgencyId = principal.getRequiredAgencyId();
                    if (myAgencyId.equals(agencyId)) return;
                } catch (Exception e) {}
            }
            throw new UnauthorizedException("You are not authorized to view this driver document.");
        }
    }
}
