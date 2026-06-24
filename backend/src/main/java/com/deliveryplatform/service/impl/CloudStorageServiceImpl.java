package com.deliveryplatform.service.impl;

import com.deliveryplatform.service.CloudStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@Service
public class CloudStorageServiceImpl implements CloudStorageService {
    @Override
    public String save(MultipartFile file) {
        return save(file, "proofs");
    }

    @Override
    public String save(MultipartFile file, String folder) {
        // Phase 5 Mock Implementation
        // In a real scenario, this would upload to S3/Azure and return the public URL
        String filename = file.getOriginalFilename();
        String extension = "";
        if (filename != null && filename.contains(".")) {
            extension = filename.substring(filename.lastIndexOf("."));
        }

        String safeFolder = (folder == null || folder.isBlank()) ? "uploads" : folder.trim();
        return "https://cdn.cargolink.ma/" + safeFolder + "/" + UUID.randomUUID() + extension;
    }
}
