package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.date BETWEEN :start AND :end")
    Page<Transaction> findByWalletUserIdAndTypeAndDateBetween(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.date BETWEEN :start AND :end")
    Page<Transaction> findByWalletUserIdAndDateBetween(
            @Param("userId") UUID userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
 
    @Query("SELECT t FROM Transaction t WHERE t.type = :type AND t.status = :status")
    List<Transaction> findByTypeAndStatus(
            @Param("type") TransactionType type, @Param("status") TransactionStatus status);

        @Query("SELECT t FROM Transaction t WHERE t.type = :type ORDER BY t.date DESC")
        List<Transaction> findByTypeOrderByDateDesc(@Param("type") TransactionType type);

    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.status = :status")
    List<Transaction> findByWalletUserIdAndTypeAndStatus(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("status") TransactionStatus status);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type")
    List<Transaction> findByWalletUserIdAndType(
            @Param("userId") UUID userId, @Param("type") TransactionType type);
 
    @Query("SELECT COUNT(t) FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type")
    long countByWalletUserIdAndType(@Param("userId") UUID userId, @Param("type") TransactionType type);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type IN :types")
    List<Transaction> findByWalletUserIdAndTypeIn(
            @Param("userId") UUID userId, @Param("types") Collection<TransactionType> types);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.date >= :date")
    List<Transaction> findByWalletUserIdAndTypeAndDateGreaterThan(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("date") LocalDateTime date);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type IN :types AND t.date >= :date")
    List<Transaction> findByWalletUserIdAndTypeInAndDateGreaterThan(
            @Param("userId") UUID userId, @Param("types") Collection<TransactionType> types, @Param("date") LocalDateTime date);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId")
    List<Transaction> findByWalletUserId(@Param("userId") UUID userId);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.orderId = :orderId")
    List<Transaction> findByWalletUserIdAndTypeAndOrderId(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("orderId") UUID orderId);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.status = :status AND t.orderId = :orderId")
    List<Transaction> findByWalletUserIdAndTypeAndStatusAndOrderId(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("status") TransactionStatus status, @Param("orderId") UUID orderId);
 
    @Query("SELECT SUM(t.amount) FROM Transaction t JOIN t.wallet w JOIN w.user u WHERE u.id = :userId AND t.type = :type AND t.status = :status")
    java.math.BigDecimal sumAmountByWalletUserIdAndTypeAndStatus(
            @Param("userId") UUID userId, @Param("type") TransactionType type, @Param("status") TransactionStatus status);
 
    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u JOIN u.agency a WHERE a.id = :agencyId AND t.type = :type")
    List<Transaction> findByAgencyIdAndType(@Param("agencyId") UUID agencyId, @Param("type") TransactionType type);

    @Query("SELECT t FROM Transaction t JOIN t.wallet w JOIN w.user u JOIN u.agency a WHERE a.id = :agencyId AND t.type = :type")
    Page<Transaction> findByAgencyIdAndType(@Param("agencyId") UUID agencyId, @Param("type") TransactionType type, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transaction t JOIN t.wallet w JOIN w.user u JOIN u.agency a WHERE a.id = :agencyId AND t.type = :type")
    long countByAgencyIdAndType(@Param("agencyId") UUID agencyId, @Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.status = :status")
    java.math.BigDecimal sumAmountByTypeAndStatus(@Param("type") TransactionType type, @Param("status") TransactionStatus status);
}