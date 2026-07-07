package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.response.WalletCreditResult;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.WalletService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * DEV-ONLY controller for test data seeding and diagnostic utilities.
 * <p>
 * Activated exclusively when the {@code dev} Spring profile is active.
 * This bean is <strong>never registered in production</strong>.
 * <p>
 * Architecture contract:
 * <ul>
 *   <li>This controller contains <strong>zero</strong> business logic.</li>
 *   <li>All wallet operations are delegated to {@link WalletService}.</li>
 *   <li>{@code WalletRepository} and {@code TransactionRepository} are
 *       <strong>not</strong> injected here.</li>
 * </ul>
 *
 * Base path: {@code /api/test}
 */
@RestController
@Profile("dev")
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestSetupController {

    // ── Legitimate controller-tier dependencies ────────────────────────────────
    // UserRepository is used only for user-lookup (adapter responsibility).
    // All wallet / transaction mutations go through WalletService.
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final PayoutLogRepository payoutLogRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final PasswordEncoder passwordEncoder;

    /** The single service that owns all wallet mutations. */
    private final WalletService walletService;

    // =========================================================================
    // POST /api/test/seed-test-data
    // Creates a complete test driver (user + driver profile + wallet + PayPal account).
    // =========================================================================
    @PostMapping("/seed-test-data")
    @Transactional
    public ResponseEntity<Map<String, String>> seedData() {
        String email = "testdriver_" + System.currentTimeMillis() + "@example.com";
        String password = "password123";

        User driver = new User();
        driver.setEmail(email);
        driver.setPassword(passwordEncoder.encode(password));
        driver.setFirstName("Test");
        driver.setLastName("Driver");
        driver.setRole(Role.DRIVER);
        driver.setPhoneNumber("1234567890");
        driver.setActive(true);
        driver.setStatus(UserStatus.ACTIVE);
        driver = userRepository.save(driver);

        Driver driverProfile = new Driver();
        driverProfile.setUser(driver);
        driverProfile.setName("Test Driver");
        driverProfile.setVerificationStatus(UserStatus.ACTIVE);
        driverRepository.save(driverProfile);

        // Credit initial test balance through the service layer
        walletService.creditWalletForTesting(driver.getId(), new BigDecimal("1000.00"), "seed-test-data initial balance");

        PaymentAccount account = new PaymentAccount();
        account.setUser(driver);
        account.setProvider(PaymentProviderEnum.PAYPAL);
        account.setAccountIdentifier("sb-xodmk51075559@personal.example.com");
        account.setVerified(true);
        account.setDefault(true);
        paymentAccountRepository.save(account);

        Map<String, String> result = new HashMap<>();
        result.put("email", email);
        result.put("password", password);
        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // POST /api/test/dump-state?email=user@example.com
    // Dumps the full financial state of a user for local debugging.
    // =========================================================================
    @PostMapping("/dump-state")
    public ResponseEntity<Map<String, Object>> dumpState(@RequestParam String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        var wrs = withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        var payouts = payoutLogRepository.findAll();
        System.out.println("====== PAYOUTS DUMP ======");
        for (var p : payouts) {
            System.out.println(p.getId() + " | " + p.getPaypalBatchId() + " | " + p.getStatus());
            System.out.println("Payload: " + p.getResponsePayload());
        }
        System.out.println("==========================");

        Map<String, Object> dump = new HashMap<>();
        dump.put("withdrawals", wrs);
        dump.put("payouts", payouts);
        return ResponseEntity.ok(dump);
    }

    // =========================================================================
    // POST /api/test/wallet/credit
    //
    // DEV-ONLY — Credits any user's wallet with test funds.
    // Requires an authenticated ADMIN user (JWT).
    //
    // All wallet logic lives in WalletService.creditWalletForTesting().
    // This method only: validates the request, resolves the user, delegates.
    //
    // Request body (JSON):
    //   { "email": "customer@example.com", "amount": 5000 }
    //   { "userId": "550e8400-e29b-41d4-a716-446655440000", "amount": 5000 }
    //   { "email": "driver@example.com", "amount": 200, "reason": "PayPal flow test" }
    // =========================================================================

    /** Request DTO for the wallet credit endpoint. */
    @Data
    public static class WalletCreditRequest {
        /** Email of the target user. Takes precedence over {@code userId}. */
        private String email;
        /** UUID of the target user. Used only when {@code email} is not supplied. */
        private UUID userId;
        /** Amount to credit — must be a positive value. */
        private BigDecimal amount;
        /** Optional memo appended to the transaction description. */
        private String reason;
    }

    @PostMapping("/wallet/credit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> creditWallet(@RequestBody WalletCreditRequest request) {

        // ── 1. Input validation (controller responsibility) ──────────────────
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Field 'amount' must be greater than zero"));
        }
        if (request.getEmail() == null && request.getUserId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Provide at least one of: 'email', 'userId'"));
        }

        // ── 2. Resolve user UUID (adapter / controller responsibility) ────────
        //       The controller's only job here is to translate the incoming
        //       identifier (email or UUID) into a known userId so the service
        //       can operate on a stable key.
        UUID userId;
        if (request.getEmail() != null) {
            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No user found with email: " + request.getEmail()));
            }
            userId = user.getId();
        } else {
            if (!userRepository.existsById(request.getUserId())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No user found with id: " + request.getUserId()));
            }
            userId = request.getUserId();
        }

        // ── 3. Delegate all wallet logic to the service ───────────────────────
        WalletCreditResult result = walletService.creditWalletForTesting(
                userId, request.getAmount(), request.getReason());

        return ResponseEntity.ok(result);
    }
}

