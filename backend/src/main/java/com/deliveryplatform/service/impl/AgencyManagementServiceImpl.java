package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.DriverAvailability;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.response.AgencyResponse;
import com.deliveryplatform.dto.response.AgencyMetricsResponse;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.WalletResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.AgencyMapper;
import com.deliveryplatform.mapper.DriverMapper;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.service.AgencyManagementService;
import com.deliveryplatform.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgencyManagementServiceImpl implements AgencyManagementService {

    private final AgencyRepository agencyRepository;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final AgencyMapper agencyMapper;
    private final DriverMapper driverMapper;
    private final OrderMapper orderMapper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;

    @Override
    public List<AgencyResponse> findAll() {
        return agencyRepository.findAll().stream()
                .map(agencyMapper::toResponse)
                .toList();
    }

    @Override
    public AgencyResponse findById(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        return agencyMapper.toResponse(agency);
    }

    @Override
        public AgencyMetricsResponse getMetrics(UUID id) {
                agencyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        long totalOrders = orderRepository.countByAgencyId(id);
        long activeDrivers = driverRepository.findByAgencyId(id).stream()
                .filter(driver -> driver.getAvailability() != DriverAvailability.OFFLINE)
                .count();
        BigDecimal walletBalance = agencyWalletRepository.findByAgencyId(id)
                .map(AgencyWallet::getBalance)
                .orElse(BigDecimal.ZERO);
        return AgencyMetricsResponse.builder()
                .totalOrders(totalOrders)
                .activeDrivers(activeDrivers)
                .walletBalance(walletBalance)
                .pendingCOD(BigDecimal.ZERO)
                .totalRevenue(BigDecimal.ZERO)
                .pendingPickups(0)
                .ongoingDeliveries(0)
                .issuesCount(0)
                .weeklyOrders(List.of())
                .driversStatus(List.of())
                .build();
    }

    @Override
    public List<DriverResponse> getDrivers(UUID id) {
        agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        return driverRepository.findByAgencyId(id).stream()
                .map(driverMapper::toResponse)
                .toList();
    }

    @Override
    public List<OrderResponse> getOrders(UUID id) {
        agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        return orderRepository.findByAgencyId(id, org.springframework.data.domain.Pageable.unpaged()).getContent().stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Override
    public WalletResponse getWallet(UUID id) {
        agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        
        AgencyWallet aw = agencyWalletRepository.findByAgencyId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency wallet", "agencyId", id));
        return WalletResponse.builder()
                .id(aw.getId().toString())
                .balance(aw.getBalance())
                .build();
    }

    @Override
    public void updateCommission(UUID id, BigDecimal commission) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        agency.setCommissionRate(commission);
        agencyRepository.save(agency);
    }

    @Override
    public void updateStatus(UUID id, String status) {
        agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        throw new UnsupportedOperationException("Agency status is not modeled on the Agency entity.");
    }

    @Override
    public void resetAdminPassword(UUID agencyId) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        User adminUser = agency.getAdminAgency();
        if (adminUser == null) {
            throw new RuntimeException("Agency has no linked admin user");
        }
        String tempPassword = generateTempPassword();
        adminUser.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(adminUser);
        emailNotificationService.sendTempPasswordEmail(adminUser.getEmail(), adminUser.getFirstName(), tempPassword);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    @Override
    public void hideAgency(UUID agencyId) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        agency.setDeleted(true);
        agencyRepository.save(agency);
        log.info("Agency {} hidden", agencyId);
    }

    @Override
    public void updateCity(UUID agencyId, String city) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        agency.setCity(city);
        agencyRepository.save(agency);
        log.info("Agency {} city updated to {}", agencyId, city);
    }
}
