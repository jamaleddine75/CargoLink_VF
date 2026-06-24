package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.AuditLog;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.repository.AuditLogRepository;
import com.deliveryplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(UUID actorId, String action, String target, String ipAddress) {
        User actor = userRepository.findById(actorId).orElse(null);
        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action(action)
                .target(target)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void log(String actorEmail, String action, String target, String ipAddress) {
        User actor = userRepository.findByEmail(actorEmail).orElse(null);
        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action(action)
                .target(target)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void logFinancialAction(UUID actorId, String action, UUID targetUserId, java.math.BigDecimal amount, String details) {
        User actor = userRepository.findById(actorId).orElse(null);
        String fullDetails = String.format("Target: %s | Amount: %s | %s", targetUserId, amount, details);
        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action("FINANCIAL_" + action)
                .target(targetUserId != null ? targetUserId.toString() : "SYSTEM")
                .ipAddress(fullDetails) // Storing details in ipAddress column for now or we could add a details column
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void logOrderAction(UUID actorId, UUID orderId, String action, String details) {
        log(actorId, action, "Order:" + orderId + (details != null ? " | " + details : ""), "0.0.0.0");
    }

    @Transactional
    public void logSystemAction(String action, String details) {
        log((UUID)null, "SYSTEM_" + action, details, "127.0.0.1");
    }
}
