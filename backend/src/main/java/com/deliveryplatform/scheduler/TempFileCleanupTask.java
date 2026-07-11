package com.deliveryplatform.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@Slf4j
public class TempFileCleanupTask {

    @Value("${app.storage.path:uploads}")
    private String storagePath;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    public void cleanupOldTempFiles() {
        Path tempDir = Paths.get(storagePath, "temp-registration").toAbsolutePath().normalize();
        if (!Files.exists(tempDir)) {
            return;
        }

        log.info("Starting cleanup of old temporary registration files in {}", tempDir);
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(tempDir)) {
            for (Path file : stream) {
                if (Files.isRegularFile(file)) {
                    BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
                    if (attrs.lastModifiedTime().toInstant().isBefore(cutoff)) {
                        try {
                            Files.delete(file);
                            log.debug("Deleted old temp file: {}", file.getFileName());
                        } catch (IOException e) {
                            log.error("Failed to delete temp file {}", file.getFileName(), e);
                        }
                    }
                }
            }
        } catch (IOException e) {
            log.error("Failed to scan temp directory for cleanup", e);
        }
    }
}
