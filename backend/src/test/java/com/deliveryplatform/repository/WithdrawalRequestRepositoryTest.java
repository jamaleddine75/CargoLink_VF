package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("dev")
@Transactional
public class WithdrawalRequestRepositoryTest {

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentAccountRepository paymentAccountRepository;

    @Test
    public void testSaveWithdrawalRequest() {
        // Create User
        User user = new User();
        user.setEmail("test-withdrawal@example.com");
        user.setPassword("password");
        user.setRole(Role.DRIVER);
        user = userRepository.save(user);

        // Create PaymentAccount
        PaymentAccount account = new PaymentAccount();
        account.setUser(user);
        account.setProvider(PaymentProviderEnum.PAYPAL);
        account.setAccountIdentifier("test@paypal.com");
        account = paymentAccountRepository.save(account);

        // Create WithdrawalRequest
        WithdrawalRequest req = new WithdrawalRequest();
        req.setUser(user);
        req.setAmount(new BigDecimal("150.00"));
        req.setPaymentAccountId(account.getId());
        req.setReceiverEmailSnapshot("test@paypal.com");
        req.setProvider(PaymentProviderEnum.PAYPAL);
        req.setStatus(TransactionStatus.PENDING);

        WithdrawalRequest saved = withdrawalRequestRepository.save(req);

        // Verify
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getPaymentAccountId()).isEqualTo(account.getId());
    }
}
