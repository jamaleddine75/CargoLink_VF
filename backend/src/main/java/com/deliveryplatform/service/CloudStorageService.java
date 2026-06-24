package com.deliveryplatform.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudStorageService {
    String save(MultipartFile file);
    String save(MultipartFile file, String folder);
}
