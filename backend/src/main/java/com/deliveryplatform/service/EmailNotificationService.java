package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.User;

public interface EmailNotificationService {
    void sendApprovalEmail(User user);
    void sendRejectionEmail(User user, String reason);
    void sendWelcomeEmail(User user);
    
    // Direct methods for better flexibility
    void sendAccountActivationEmail(String email, String firstName);
    void sendAccountRejectionEmail(String email, String firstName, String reason);
    void sendTempPasswordEmail(String email, String firstName, String tempPassword);
}
