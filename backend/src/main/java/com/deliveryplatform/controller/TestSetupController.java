package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/v3/api-docs")
@RequiredArgsConstructor
public class TestSetupController {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final WalletRepository walletRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final PasswordEncoder passwordEncoder;

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

        Wallet wallet = new Wallet();
        wallet.setUser(driver);
        wallet.setBalance(new BigDecimal("1000.00"));
        walletRepository.save(wallet);

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

    private final com.deliveryplatform.repository.TransactionRepository transactionRepository;
    private final com.deliveryplatform.repository.WithdrawalRequestRepository withdrawalRequestRepository;
    private final com.deliveryplatform.repository.PayoutLogRepository payoutLogRepository;

    @PostMapping("/dump-state")
    public ResponseEntity<Map<String, Object>> dumpState(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Wallet wallet = walletRepository.findByUserId(user.getId()).orElse(null);
        var txs = transactionRepository.findByWalletUserId(user.getId());
        var wrs = withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        var payouts = payoutLogRepository.findAll();
        System.out.println("====== PAYOUTS DUMP ======");
        for (var p : payouts) {
            System.out.println(p.getId() + " | " + p.getPaypalBatchId() + " | " + p.getStatus());
            System.out.println("Payload: " + p.getResponsePayload());
        }
        System.out.println("==========================");

        Map<String, Object> dump = new HashMap<>();
        dump.put("wallet", wallet);
        dump.put("transactions", txs);
        dump.put("withdrawals", wrs);
        dump.put("payouts", payouts);
        return ResponseEntity.ok(dump);
    }
}
