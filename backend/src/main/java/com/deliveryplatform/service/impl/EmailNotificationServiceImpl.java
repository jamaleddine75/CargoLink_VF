package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@cargolink.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendApprovalEmail(User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("✅ CargoLink – Account Approved!");
            helper.setText(buildApprovalHtml(user), true);
            mailSender.send(message);
            log.info("Approval email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send approval email to {}: {}. Note: This didn't stop the database update.", user.getEmail(), e.getMessage());
            // We don't throw exception to avoid rolling back the user activation transaction
        }
    }

    @Override
    public void sendRejectionEmail(User user, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("❌ CargoLink – Account Registration Status");
            helper.setText(buildRejectionHtml(user, reason), true);
            mailSender.send(message);
            log.info("Rejection email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send rejection email to {}: {}. Note: This didn't stop the database update.", user.getEmail(), e.getMessage());
            // We don't throw exception to avoid rolling back the user rejection transaction
        }
    }

    @Override
    public void sendWelcomeEmail(User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("🚀 Welcome to CargoLink!");
            helper.setText(buildWelcomeHtml(user), true);
            mailSender.send(message);
            log.info("Welcome email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    public void sendAccountActivationEmail(String email, String firstName) {
        // Wrapper for convenience
        User mock = User.builder().email(email).firstName(firstName).build();
        sendApprovalEmail(mock);
    }

    @Override
    public void sendAccountRejectionEmail(String email, String firstName, String reason) {
        // Wrapper for convenience
        User mock = User.builder().email(email).firstName(firstName).build();
        sendRejectionEmail(mock, reason);
    }

    @Override
    public void sendTempPasswordEmail(String email, String firstName, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🔐 CargoLink – Your Temporary Password");
            helper.setText(buildTempPasswordHtml(firstName, tempPassword), true);
            mailSender.send(message);
            log.info("Temp password email sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send temp password email to {}: {}", email, e.getMessage());
        }
    }

    private String buildTempPasswordHtml(String firstName, String tempPassword) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <div style="width: 64px; height: 64px; background: #6366f1; border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">🔐</div>
                      <h1 style="color: #fff; margin-top: 16px;">Password Reset</h1>
                    </div>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>Your account password has been reset by a CargoLink administrator.</p>
                    <p>Your temporary password is:</p>
                    <div style="text-align: center; margin: 24px 0;">
                      <div style="display: inline-block; background: rgba(99,102,241,0.15); border: 2px solid rgba(99,102,241,0.4); border-radius: 12px; padding: 16px 32px;">
                        <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #818cf8; letter-spacing: 4px;">%s</span>
                      </div>
                    </div>
                    <p>Please log in and change your password immediately.</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="%s/login" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Login Now</a>
                    </div>
                    <p style="color: #64748b; font-size: 12px;">If you did not request this reset, contact support immediately.</p>
                  </div>
                </body>
                </html>
                """.formatted(firstName != null ? firstName : "Agency Admin", tempPassword, frontendUrl);
    }

    private String buildApprovalHtml(User user) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <div style="width: 64px; height: 64px; background: #22c55e; border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✓</div>
                      <h1 style="color: #fff; margin-top: 16px;">Account Approved!</h1>
                    </div>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>We're excited to inform you that your CargoLink account has been <strong style="color: #22c55e;">approved</strong>.</p>
                    <p>You can now log in and access the platform.</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="%s/login" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Access Dashboard</a>
                    </div>
                    <p style="color: #64748b; font-size: 12px;">If you didn't create this account, please contact support.</p>
                  </div>
                </body>
                </html>
                """.formatted(user.getFirstName(), frontendUrl);
    }

    private String buildRejectionHtml(User user, String reason) {
        String reasonText = (reason != null && !reason.isBlank()) ? reason : "Your application did not meet our current requirements.";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <div style="width: 64px; height: 64px; background: #ef4444; border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✕</div>
                      <h1 style="color: #fff; margin-top: 16px;">Application Update</h1>
                    </div>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>After reviewing your application, we regret to inform you that your account registration has been <strong style="color: #ef4444;">declined</strong>.</p>
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
                      <p style="margin: 0;"><strong>Reason:</strong> %s</p>
                    </div>
                    <p>If you believe this is an error, please contact our support team.</p>
                    <p style="color: #64748b; font-size: 12px;">CargoLink Team</p>
                  </div>
                </body>
                </html>
                """.formatted(user.getFirstName(), reasonText);
    }

    private String buildWelcomeHtml(User user) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px;">
                    <h1 style="color: #fff;">Welcome to CargoLink, %s! 🚀</h1>
                    <p>Your registration is complete. Your account is currently <strong>under review</strong>.</p>
                    <p>You'll receive an email once it has been approved by our team (usually within 24 hours).</p>
                  </div>
                </body>
                </html>
                """.formatted(user.getFirstName());
    }
}
