package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.PaymentAccount;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.request.CreatePaymentAccountRequest;
import com.deliveryplatform.dto.response.PaymentAccountResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.repository.PaymentAccountRepository;
import com.deliveryplatform.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment-accounts")
@RequiredArgsConstructor
public class PaymentAccountController {

    private final PaymentAccountRepository paymentAccountRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'AGENCY', 'CLIENT')")
    public ResponseEntity<PaymentAccountResponse> createPaymentAccount(
            Principal principal,
            @Valid @RequestBody CreatePaymentAccountRequest request) {
        
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getName()));

        if (request.getProvider() != com.deliveryplatform.domain.entity.PaymentProviderEnum.PAYPAL) {
            throw new com.deliveryplatform.exception.BusinessException("Only PayPal is supported for payment accounts.");
        }

        // Simple implementation: Mark verified true for prototype, in prod require email validation
        PaymentAccount account = PaymentAccount.builder()
                .user(user)
                .provider(request.getProvider())
                .accountIdentifier(request.getAccountIdentifier())
                .verified(true)
                .verifiedAt(java.time.LocalDateTime.now())
                .isDefault(request.isDefault())
                .status("ACTIVE")
                .preferredCurrency(request.getPreferredCurrency() != null ? request.getPreferredCurrency() : "MAD")
                .build();

        if (request.isDefault()) {
            paymentAccountRepository.findByUserId(user.getId())
                .forEach(acc -> {
                    if (acc.isDefault()) {
                        acc.setDefault(false);
                        paymentAccountRepository.save(acc);
                    }
                });
        }

        account = paymentAccountRepository.save(account);

        return ResponseEntity.ok(toResponse(account));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'AGENCY', 'CLIENT')")
    public ResponseEntity<List<PaymentAccountResponse>> getMyPaymentAccounts(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getName()));

        List<PaymentAccountResponse> accounts = paymentAccountRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(accounts);
    }

    private PaymentAccountResponse toResponse(PaymentAccount account) {
        return PaymentAccountResponse.builder()
                .id(account.getId())
                .provider(account.getProvider())
                .accountIdentifier(account.getAccountIdentifier())
                .verified(account.isVerified())
                .verifiedAt(account.getVerifiedAt())
                .isDefault(account.isDefault())
                .preferredCurrency(account.getPreferredCurrency())
                .status(account.getStatus())
                .build();
    }
}
