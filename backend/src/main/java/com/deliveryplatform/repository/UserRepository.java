package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    List<User> findByStatus(UserStatus status);
    long countByRoleAndIsActive(Role role, boolean isActive);
    long countByIsActiveTrue();
    long countByRoleAndIsActiveAndCreatedAtBetween(Role role, boolean isActive, LocalDateTime start, LocalDateTime end);
    long countByRole(Role role);
    List<User> findByRole(Role role);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(:query) OR LOWER(u.lastName) LIKE LOWER(:query) OR LOWER(u.email) LIKE LOWER(:query)")
    List<User> searchGlobal(String query);
}