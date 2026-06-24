package com.deliveryplatform.controller;

import com.deliveryplatform.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controller to explicitly serve uploaded files.
 * Ensures 404 is returned instead of 500 when files are missing.
 */
@RestController
@RequestMapping("/api/uploads")
@Slf4j
public class FileController {

    private final Path rootLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/{folder}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String folder, @PathVariable String filename) {
        try {
            // Security check: ensure folder is one of the allowed ones
            if (!folder.equals("avatars") && !folder.equals("proofs")) {
                throw new ResourceNotFoundException("Directory", "name", folder);
            }

            Path file = rootLocation.resolve(folder).resolve(filename).normalize();
            
            // Security check: ensure the resolved path is still within the rootLocation
            if (!file.startsWith(rootLocation)) {
                throw new ResourceNotFoundException("File", "filename", filename);
            }

            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    contentType = MediaType.IMAGE_JPEG_VALUE;
                } else if (filename.toLowerCase().endsWith(".png")) {
                    contentType = MediaType.IMAGE_PNG_VALUE;
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                log.warn("File not found: {}", file);
                
                // Fallback for avatars
                if ("avatars".equals(folder)) {
                    Path defaultAvatar = rootLocation.resolve("avatars").resolve("default-avatar.png");
                    if (Files.exists(defaultAvatar)) {
                        Resource fallbackResource = new UrlResource(defaultAvatar.toUri());
                        return ResponseEntity.ok()
                                .contentType(MediaType.IMAGE_PNG)
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"default-avatar.png\"")
                                .body(fallbackResource);
                    }
                }
                
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("Error serving file {}: {}", filename, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
