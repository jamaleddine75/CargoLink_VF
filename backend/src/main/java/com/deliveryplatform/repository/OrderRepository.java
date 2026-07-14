package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByTrackingNumber(String trackingNumber);
    List<Order> findByTrackingNumberIn(Collection<String> trackingNumbers);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByPaymentStatus(PaymentStatus paymentStatus);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByDriverIdAndStatusIn(UUID driverId, Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("""
            SELECT o FROM Order o
            WHERE o.driver.id = :driverId
            AND o.status IN :statuses
            AND (CAST(:startDate AS date) IS NULL OR (o.deliveredAt >= :startDate OR o.createdAt >= :startDate))
            AND (CAST(:endDate AS date) IS NULL OR (o.deliveredAt <= :endDate OR o.createdAt <= :endDate))
            ORDER BY COALESCE(o.deliveredAt, o.createdAt) DESC
            """)
    Page<Order> findDriverHistory(
            @Param("driverId") UUID driverId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByDriverIdAndStatusIn(UUID driverId, Collection<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByStatusIn(Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByStatusIn(Collection<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Optional<Order> findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(UUID driverId, Collection<OrderStatus> statuses);

    boolean existsByDriverIdAndStatusIn(UUID driverId, Collection<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId")
    List<Order> findAllByClientId(@Param("clientId") UUID clientId);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId")
    Page<Order> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId AND o.status IN :statuses")
    Page<Order> findByClientIdAndStatusIn(@Param("clientId") UUID clientId, @Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId AND o.status = :status")
    Page<Order> findByClientIdAndStatus(@Param("clientId") UUID clientId, @Param("status") OrderStatus status, Pageable pageable);

    long countByClientId(UUID clientId);
    long countByClientIdAndStatus(UUID clientId, OrderStatus status);
    long countByClientIdAndStatusIn(UUID clientId, Collection<OrderStatus> statuses);
    long countByClientIdAndCreatedAtAfter(UUID clientId, LocalDateTime createdAfter);

    long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.driver.id = :driverId AND o.status = :status")
    long countByDriverIdAndStatus(@Param("driverId") UUID driverId, @Param("status") OrderStatus status);

    // Agency methods
    long countByAgencyId(UUID agencyId);
    long countByAgencyIdAndStatus(UUID agencyId, OrderStatus status);
    long countByAgencyIdAndStatusIn(UUID agencyId, Collection<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.agency.id = :agencyId OR o.driver.agency.id = :agencyId")
    Page<Order> findByAgencyIdOrDriverAgencyId(@Param("agencyId") UUID agencyId, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE (o.agency.id = :agencyId OR o.driver.agency.id = :agencyId) AND o.status IN :statuses")
    Page<Order> findByAgencyIdOrDriverAgencyIdAndStatusIn(@Param("agencyId") UUID agencyId, @Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByAgencyId(UUID agencyId, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByAgencyIdAndStatusIn(UUID agencyId, Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.agency.id = :agencyId OR o.driver.agency.id = :agencyId")
    List<Order> findByAgencyIdOrDriverAgencyIdList(@Param("agencyId") UUID agencyId);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE (o.agency.id = :agencyId OR o.driver.agency.id = :agencyId) AND o.status = :status")
    List<Order> findByAgencyIdOrDriverAgencyIdAndStatusList(@Param("agencyId") UUID agencyId, @Param("status") OrderStatus status);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByAgencyIdAndStatus(UUID agencyId, OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByAgencyIdAndStatus(UUID agencyId, OrderStatus status);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByAgencyId(UUID agencyId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByStatusAndCreatedAtBetween(OrderStatus status, LocalDateTime start, LocalDateTime end);
    long countByStatusInAndCreatedAtBetween(Collection<OrderStatus> statuses, LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(o.codAmount) FROM Order o WHERE o.status = com.deliveryplatform.domain.entity.OrderStatus.DELIVERED")
    java.math.BigDecimal sumTotalCod();

    @Query("SELECT SUM(o.codAmount) FROM Order o WHERE o.status = com.deliveryplatform.domain.entity.OrderStatus.DELIVERED AND o.codCollected = false")
    java.math.BigDecimal sumPendingCod();

    @Query("SELECT SUM(o.codAmount) FROM Order o WHERE o.status = com.deliveryplatform.domain.entity.OrderStatus.DELIVERED AND o.codCollected = true")
    java.math.BigDecimal sumPaidCod();

    @Query("SELECT SUM(o.codAmount) FROM Order o JOIN o.client c WHERE c.id = :clientId AND o.status <> com.deliveryplatform.domain.entity.OrderStatus.DELIVERED AND o.status <> com.deliveryplatform.domain.entity.OrderStatus.CANCELLED AND o.status <> com.deliveryplatform.domain.entity.OrderStatus.RETURNED")
    java.math.BigDecimal sumActiveCodByClientId(@Param("clientId") UUID clientId);

    @Query("SELECT SUM(o.codAmount) FROM Order o JOIN o.client c WHERE c.id = :clientId AND o.status = com.deliveryplatform.domain.entity.OrderStatus.DELIVERED AND o.codCollected = false")
    java.math.BigDecimal sumPendingCodByClientId(@Param("clientId") UUID clientId);

    @Query("SELECT SUM(o.codAmount) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.codCollected = :collected")
    java.math.BigDecimal sumTotalCodByDriverIdAndStatus(@Param("driverId") UUID driverId, @Param("status") OrderStatus status, @Param("collected") boolean collected);

    @Query("SELECT SUM(o.driverEarnings) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status")
    java.math.BigDecimal sumDriverEarningsByDriverIdAndStatus(@Param("driverId") UUID driverId, @Param("status") OrderStatus status);

    @Query("SELECT SUM(o.driverEarnings) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.createdAt >= :createdAfter")
    java.math.BigDecimal sumDriverEarningsByDriverIdAndStatusAndCreatedAtAfter(@Param("driverId") UUID driverId, @Param("status") OrderStatus status, @Param("createdAfter") LocalDateTime createdAfter);

    @Query("SELECT SUM(o.driverEarnings) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.createdAt >= :start AND o.createdAt < :end")
    java.math.BigDecimal sumDriverEarningsByDriverIdAndStatusAndCreatedAtBetween(
            @Param("driverId") UUID driverId,
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses AND o.driver IS NULL")
    Page<Order> findByStatusInAndDriverNull(@Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByStatusInAndDriverIsNull(Collection<OrderStatus> statuses, Pageable pageable);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") UUID id);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.driver.id = :driverId AND o.status IN :statuses AND o.id <> :excludeOrderId")
    long countOtherActiveOrders(@Param("driverId") UUID driverId, @Param("statuses") Collection<OrderStatus> statuses, @Param("excludeOrderId") UUID excludeOrderId);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByStatus(OrderStatus status);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "driver", "driver.user", "agency"})
    List<Order> findByDriverIdAndStatus(UUID driverId, OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.deliveredAt >= :deliveredAfter")
    long countByDriverIdAndStatusAndDeliveredAtAfter(@Param("driverId") UUID driverId, @Param("status") OrderStatus status, @Param("deliveredAfter") LocalDateTime deliveredAfter);

    @Query("SELECT SUM(o.driverEarnings) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.deliveredAt >= :deliveredAfter")
    java.math.BigDecimal sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(
            @Param("driverId") UUID driverId, @Param("status") OrderStatus status, @Param("deliveredAfter") java.time.LocalDateTime deliveredAfter);

    @Query("SELECT COUNT(o) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status = :status AND o.createdAt >= :createdAfter")
    long countByDriverIdAndStatusAndCreatedAtAfter(@Param("driverId") UUID driverId, @Param("status") OrderStatus status, @Param("createdAfter") LocalDateTime createdAfter);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.driver.id = :driverId")
    long countByDriverId(@Param("driverId") UUID driverId);

    long countByStatusIn(Collection<OrderStatus> statuses);
    
    @Query("SELECT COUNT(o) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.status IN :statuses")
    long countByDriverIdAndStatusIn(@Param("driverId") UUID driverId, @Param("statuses") Collection<OrderStatus> statuses);

    long countByCreatedAtAfter(LocalDateTime createdAfter);

    @Query("SELECT COUNT(o) FROM Order o JOIN o.driver d WHERE d.id = :driverId AND o.createdAt >= :createdAfter")
    long countByDriverIdAndCreatedAtAfter(@Param("driverId") UUID driverId, @Param("createdAfter") LocalDateTime createdAfter);

    long countByAgencyIdAndCreatedAtBetween(UUID agencyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(o.codAmount) FROM Order o WHERE o.agency.id = :agencyId AND o.status = com.deliveryplatform.domain.entity.OrderStatus.DELIVERED AND o.cashConfirmed = false")
    java.math.BigDecimal sumPendingCodByAgencyId(@Param("agencyId") UUID agencyId);
}
