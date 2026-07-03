package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PaymentAccount;
import com.deliveryplatform.domain.entity.PaymentProviderEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentAccountRepository extends JpaRepository<PaymentAccount, UUID> {
    List<PaymentAccount> findByUserId(UUID userId);
    Optional<PaymentAccount> findByUserIdAndProvider(UUID userId, PaymentProviderEnum provider);
    Optional<PaymentAccount> findByUserIdAndProviderAndIsDefaultTrue(UUID userId, PaymentProviderEnum provider);
}
