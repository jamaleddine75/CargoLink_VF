package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.AuditLog;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.repository.AuditLogRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void logAction(UUID actorId, String action, String target, String ipAddress) {
        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        
        AuditLog auditLog = AuditLog.builder()
                .actor(actor)
                .action(action)
                .target(target)
                .ipAddress(ipAddress)
                .build();
        
        auditLogRepository.save(auditLog);
        log.debug("Audit Log: Actor={} Action={} Target={}", actorId, action, target);
    }

    @Override
    @Transactional
    public void logOrderAction(UUID actorId, UUID orderId, String action, String details) {
        logAction(actorId, action, "Order:" + orderId + (details != null ? " | " + details : ""), null);
    }

    @Override
    @Transactional
    public void logSystemAction(String action, String details) {
        logAction(null, "SYSTEM_" + action, details, "127.0.0.1");
    }
}
