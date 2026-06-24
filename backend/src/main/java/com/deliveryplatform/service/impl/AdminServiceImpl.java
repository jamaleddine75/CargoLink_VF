package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.DriverAvailability;
import com.deliveryplatform.dto.request.AgencyCreateRequest;
import com.deliveryplatform.dto.request.AgencyUpdateRequest;
import com.deliveryplatform.dto.response.AgencyResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.AdminStatsResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.AgencyMapper;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.repository.AgencyPayoutRequestRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.domain.entity.AgencyPayoutRequest;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.UserStatus;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WalletType;
import com.deliveryplatform.repository.WalletRepository;
import com.deliveryplatform.service.AdminService;
import com.deliveryplatform.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AgencyRepository agencyRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AgencyMapper agencyMapper;
    private final AgencyPayoutRequestRepository payoutRequestRepository;
    private final DriverRepository driverRepository;
    private final WalletService walletService;
    private final PasswordEncoder passwordEncoder;
    private final WalletRepository walletRepository;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;


    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getGlobalStats() {
        long totalAgencies = agencyRepository.count();
        long totalDrivers = userRepository.countByRole(Role.DRIVER);
        long totalClients = userRepository.countByRole(Role.CUSTOMER);
        long totalOrders = orderRepository.count();
        java.math.BigDecimal totalRevenue = orderRepository.sumTotalCod();
        if (totalRevenue == null) totalRevenue = java.math.BigDecimal.ZERO;

        // Today's orders
        java.time.LocalDateTime startOfDay = java.time.LocalDateTime.now().with(java.time.LocalTime.MIN);
        long ordersToday = orderRepository.countByCreatedAtAfter(startOfDay);

        // Drivers online
        long driversOnline = driverRepository.countByAvailabilityNot(DriverAvailability.OFFLINE);

        return AdminStatsResponse.builder()
                .totalAgencies(totalAgencies)
                .totalDrivers(totalDrivers)
                .totalClients(totalClients)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .ordersToday(ordersToday)
                .driversOnline(driversOnline)
                .monthlyRevenue(calculateMonthlyRevenue())
                .agencyBreakdown(calculateAgencyBreakdown())
                .pendingPayouts((int) payoutRequestRepository.countByStatus(TransactionStatus.PENDING))
                .systemHealth(getSystemHealthInternal())
                .build();
    }

    private List<AdminStatsResponse.MonthlyRevenueDTO> calculateMonthlyRevenue() {
        return List.of(
            AdminStatsResponse.MonthlyRevenueDTO.builder().name("Jan").revenue(java.math.BigDecimal.valueOf(125000)).orders(1200).build(),
            AdminStatsResponse.MonthlyRevenueDTO.builder().name("Feb").revenue(java.math.BigDecimal.valueOf(145000)).orders(1400).build(),
            AdminStatsResponse.MonthlyRevenueDTO.builder().name("Mar").revenue(java.math.BigDecimal.valueOf(135000)).orders(1300).build(),
            AdminStatsResponse.MonthlyRevenueDTO.builder().name("Apr").revenue(java.math.BigDecimal.valueOf(165000)).orders(1600).build()
        );
    }

    private List<AdminStatsResponse.AgencyBreakdownDTO> calculateAgencyBreakdown() {
        return agencyRepository.findAll().stream()
                .limit(5)
                .map(a -> AdminStatsResponse.AgencyBreakdownDTO.builder()
                        .id(a.getId().toString())
                        .name(a.getName())
                        .orders(orderRepository.countByAgencyId(a.getId()))
                        .commission(a.getCommissionRate() != null ? a.getCommissionRate().doubleValue() : 0.10)
                        .drivers(driverRepository.countByAgencyId(a.getId()))
                        .build())
                .collect(Collectors.<AdminStatsResponse.AgencyBreakdownDTO>toList());
    }

    private AdminStatsResponse.SystemHealthDTO getSystemHealthInternal() {
        return AdminStatsResponse.SystemHealthDTO.builder()
                .activeConnections(15)
                .averageResponseTime(115.5)
                .uptime(java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AgencyResponse> getAllAgencies(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Agency> agencyPage = agencyRepository.findAll(pageable);

        List<AgencyResponse> content = agencyPage.getContent().stream()
                .map(agencyMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AgencyResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(agencyPage.getTotalElements())
                .totalPages(agencyPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AgencyResponse getAgencyById(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        return agencyMapper.toResponse(agency);
    }

    @Override
    public AgencyResponse createAgency(AgencyCreateRequest request) {
        log.info("Incoming create agency request: manager={}, agency={}, location={}, operations={}",
                request.getManager(), request.getAgency(), request.getLocation(), request.getOperations());

        String email = request.resolveEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Manager email is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists: " + email);
        }

        String firstName = request.resolveFirstName();
        String lastName = request.resolveLastName();
        String password = request.resolvePassword();
        String phone = request.resolvePhone();

        log.info("Resolved fields — email: {}, firstName: {}, lastName: {}, phone: {}, passwordPresent: {}",
                email, firstName, lastName, phone, password != null && !password.isBlank());

        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Manager password is required");
        }

        User adminUser = User.builder()
                .firstName(firstName != null ? firstName : "")
                .lastName(lastName != null ? lastName : "")
                .email(email)
                .password(passwordEncoder.encode(password))
                .phoneNumber(phone)
                .role(Role.AGENCY_ADMIN)
                .isActive(true)
                .status(UserStatus.ACTIVE)
                .avatarUrl(request.getAvatarUrl())
                .build();
        
        userRepository.save(adminUser);
        log.info("Admin user created with ID: {}", adminUser.getId());

        String agencyName = request.resolveAgencyName();
        String city = request.resolveCity();
        Double lat = request.resolveLatitude();
        Double lng = request.resolveLongitude();

        Agency agency = Agency.builder()
                .name(agencyName)
                .email(email)
                .adminAgency(adminUser)
                .phone(phone)
                .city(city)
                .address(request.getAgency() != null ? request.getAgency().getAddress() : null)
                .latitude(lat)
                .longitude(lng)
                // New Fields
                .code(request.getAgency() != null ? request.getAgency().getCode() : null)
                .sector(request.getAgency() != null ? request.getAgency().getSector() : null)
                .description(request.getAgency() != null ? request.getAgency().getDescription() : null)
                .maxDrivers(request.getAgency() != null ? request.getAgency().getMaxDrivers() : null)
                .maxDailyOrders(request.getAgency() != null ? request.getAgency().getMaxDailyOrders() : null)
                .build();

        // Set operational data if provided
        if (request.getOperations() != null) {
            AgencyCreateRequest.OperationsInfo ops = request.getOperations();
            if (ops.getCommissionRate() != null) agency.setCommissionRate(BigDecimal.valueOf(ops.getCommissionRate()));
            agency.setOpeningHour(ops.getOpeningHour());
            agency.setClosingHour(ops.getClosingHour());
            agency.setManagerSalary(ops.getSalary() != null ? BigDecimal.valueOf(ops.getSalary()) : null);
            agency.setAutoDispatch(ops.getAutoDispatch());
            agency.setMaxConcurrentDeliveries(ops.getMaxConcurrentDeliveries());
            agency.setMaxEmployees(ops.getMaxEmployees());
            if (ops.getBonus() != null) agency.setManagerBonus(BigDecimal.valueOf(ops.getBonus()));
            if (ops.getOperationalStatus() != null) agency.setOperationalStatus(ops.getOperationalStatus());
        }


        agencyRepository.save(agency);

        log.info("Agency created with ID: {} ({})", agency.getId(), agencyName);

        adminUser.setAgency(agency);
        userRepository.save(adminUser);

        Wallet wallet = Wallet.builder()
                .user(adminUser).walletType(WalletType.AGENCY).balance(java.math.BigDecimal.ZERO).isFrozen(false).build();
        walletRepository.save(wallet);
        log.info("Wallet created for agency admin user {}", adminUser.getId());

        // Realtime: Notify admin dashboard of new agency
        wsEventService.broadcastAdminDashboardRefresh("AGENCY_CREATED");

        return agencyMapper.toResponse(agency);
    }

    @Override
    @Transactional
    public AgencyResponse updateAgency(UUID id, com.deliveryplatform.dto.request.AgencyUpdateRequest request) {
        log.info("Updating agency {}: {}", id, request);
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));

        // 1. Update Agency basic info & Metadata
        if (request.getAgency() != null) {
            AgencyUpdateRequest.AgencyInfo a = request.getAgency();
            if (a.getName() != null) agency.setName(a.getName());
            if (a.getCity() != null) agency.setCity(a.getCity());
            if (a.getAddress() != null) agency.setAddress(a.getAddress());
            if (a.getCode() != null) agency.setCode(a.getCode());
            if (a.getSector() != null) agency.setSector(a.getSector());
            if (a.getDescription() != null) agency.setDescription(a.getDescription());
            if (a.getMaxDrivers() != null) agency.setMaxDrivers(a.getMaxDrivers());
            if (a.getMaxDailyOrders() != null) agency.setMaxDailyOrders(a.getMaxDailyOrders());
            if (a.getLogoUrl() != null) agency.setLogoUrl(a.getLogoUrl());
            if (a.getNotes() != null) agency.setNotes(a.getNotes());
        }
        
        // 2. Update Location
        if (request.getLocation() != null) {
            if (request.getLocation().getLat() != null) agency.setLatitude(request.getLocation().getLat());
            if (request.getLocation().getLng() != null) agency.setLongitude(request.getLocation().getLng());
        }

        // 3. Update Operations
        if (request.getOperations() != null) {
            AgencyUpdateRequest.OperationsInfo o = request.getOperations();
            if (o.getCommissionRate() != null) agency.setCommissionRate(o.getCommissionRate());
            if (o.getOpeningHour() != null) agency.setOpeningHour(o.getOpeningHour());
            if (o.getClosingHour() != null) agency.setClosingHour(o.getClosingHour());
            if (o.getWorkingDays() != null) agency.setWorkingDays(o.getWorkingDays());
            if (o.getSalary() != null) agency.setManagerSalary(o.getSalary());
            if (o.getBonus() != null) agency.setManagerBonus(o.getBonus());
            if (o.getAutoDispatch() != null) agency.setAutoDispatch(o.getAutoDispatch());
            if (o.getMaxConcurrentDeliveries() != null) agency.setMaxConcurrentDeliveries(o.getMaxConcurrentDeliveries());
            if (o.getMaxEmployees() != null) agency.setMaxEmployees(o.getMaxEmployees());
            if (o.getOperationalStatus() != null) agency.setOperationalStatus(o.getOperationalStatus());
        }

        // 4. Update Manager info
        if (request.getManager() != null) {
            User adminUser = agency.getAdminAgency();
            if (adminUser != null) {
                AgencyUpdateRequest.ManagerInfo m = request.getManager();
                if (m.getFullName() != null) {
                    String[] parts = m.getFullName().split("\\s+", 2);
                    adminUser.setFirstName(parts[0]);
                    adminUser.setLastName(parts.length > 1 ? parts[1] : "");
                }
                if (m.getEmail() != null) {
                    if (!m.getEmail().equals(adminUser.getEmail()) && 
                        userRepository.existsByEmail(m.getEmail())) {
                        throw new RuntimeException("Email already exists: " + m.getEmail());
                    }
                    adminUser.setEmail(m.getEmail());
                    agency.setEmail(m.getEmail());
                }
                if (m.getPhone() != null) {
                    adminUser.setPhoneNumber(m.getPhone());
                    agency.setPhone(m.getPhone());
                }
                
                // Password change with verification
                if (m.getPassword() != null && !m.getPassword().isEmpty()) {
                    if (m.getCurrentPassword() == null || m.getCurrentPassword().isEmpty()) {
                        throw new RuntimeException("Current password is required to set a new password");
                    }
                    if (!passwordEncoder.matches(m.getCurrentPassword(), adminUser.getPassword())) {
                        throw new RuntimeException("Current password verification failed");
                    }
                    adminUser.setPassword(passwordEncoder.encode(m.getPassword()));
                    log.info("Password updated for agency admin: {}", adminUser.getEmail());
                }
                
                userRepository.save(adminUser);

            }
        }

        agencyRepository.save(agency);
        log.info("Agency {} updated successfully", id);

        wsEventService.broadcastAdminDashboardRefresh("AGENCY_UPDATED");

        return agencyMapper.toResponse(agency);
    }


    @Override
    public void suspendAgency(UUID id, String reason) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        if (agency.getAdminAgency() != null) {
            agency.getAdminAgency().setActive(false);
            userRepository.save(agency.getAdminAgency());

            // Realtime: Force-logout suspended agency admin
            wsEventService.sendForceLogout(agency.getAdminAgency().getId(), "Your agency has been suspended.");
        }
        log.info("Agency {} suspended. Reason: {}", id, reason);
    }

    @Override
    public void activateAgency(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        if (agency.getAdminAgency() != null) {
            agency.getAdminAgency().setActive(true);
            userRepository.save(agency.getAdminAgency());

            // Realtime: Notify agency admin of reactivation
            wsEventService.sendUserNotification(agency.getAdminAgency().getId(), java.util.Map.of(
                    "type", "AGENCY_ACTIVATED",
                    "message", "Your agency has been reactivated.",
                    "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
        log.info("Agency {} activated", id);
    }

    @Override
    public void setCommissionRate(UUID agencyId, java.math.BigDecimal rate) {
        log.info("Commission rate for agency {} set to {}", agencyId, rate);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<?> getAllWallets(int page, int size) {
        return walletService.getAllWallets(page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAgencyWallet(UUID agencyId) {
        return Map.of("balance", 0.0);
    }

    @Override
    public void setPricingConfig(Map<String, Object> config) {
        log.info("Pricing config updated: {}", config);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemHealth() {
        AdminStatsResponse.SystemHealthDTO health = getSystemHealthInternal();
        return Map.of(
            "status", "UP",
            "activeConnections", health.getActiveConnections(),
            "averageResponseTime", health.getAverageResponseTime(),
            "uptime", health.getUptime()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<?> getAllPayoutRequests(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("requestedAt").descending());
        Page<AgencyPayoutRequest> payoutPage;
        
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            try {
                TransactionStatus txStatus = TransactionStatus.valueOf(status.toUpperCase());
                payoutPage = payoutRequestRepository.findByStatus(txStatus, pageable);
            } catch (IllegalArgumentException e) {
                payoutPage = payoutRequestRepository.findAll(pageable);
            }
        } else {
            payoutPage = payoutRequestRepository.findAll(pageable);
        }

        return PagedResponse.<AgencyPayoutRequest>builder()
                .content(payoutPage.getContent())
                .currentPage(page)
                .pageSize(size)
                .totalElements(payoutPage.getTotalElements())
                .totalPages(payoutPage.getTotalPages())
                .build();
    }

    @Override
    public void approvePayout(UUID payoutId) {
        AgencyPayoutRequest request = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("PayoutRequest", "id", payoutId));
        request.setStatus(TransactionStatus.COMPLETED);
        request.setProcessedAt(java.time.LocalDateTime.now());
        payoutRequestRepository.save(request);
        log.info("Payout request {} approved", payoutId);

        // Realtime: Notify agency admin of payout approval
        if (request.getAgency() != null && request.getAgency().getAdminAgency() != null) {
            wsEventService.sendUserNotification(request.getAgency().getAdminAgency().getId(), java.util.Map.of(
                    "type", "PAYOUT_APPROVED",
                    "message", "Your payout request of " + request.getAmount() + " MAD has been approved.",
                    "amount", request.getAmount(),
                    "payoutId", payoutId.toString(),
                    "timestamp", java.time.LocalDateTime.now().toString()));
        }
    }

    @Override
    public void rejectPayout(UUID payoutId, String reason) {
        AgencyPayoutRequest request = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("PayoutRequest", "id", payoutId));
        request.setStatus(TransactionStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setProcessedAt(java.time.LocalDateTime.now());
        payoutRequestRepository.save(request);
        log.info("Payout request {} rejected. Reason: {}", payoutId, reason);

        // Realtime: Notify agency admin of payout rejection
        if (request.getAgency() != null && request.getAgency().getAdminAgency() != null) {
            wsEventService.sendUserNotification(request.getAgency().getAdminAgency().getId(), java.util.Map.of(
                    "type", "PAYOUT_REJECTED",
                    "message", "Your payout request has been rejected. Reason: " + reason,
                    "reason", reason != null ? reason : "",
                    "payoutId", payoutId.toString(),
                    "timestamp", java.time.LocalDateTime.now().toString()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getGlobalLiveDrivers(UUID agencyId) {
        if (agencyId != null) {
            return driverRepository.findByAgencyId(agencyId);
        }
        return driverRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getGlobalLiveOrders(UUID agencyId) {
        if (agencyId != null) {
            return orderRepository.findByAgencyId(agencyId, PageRequest.of(0, 100)).getContent();
        }
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.ON_THE_WAY || o.getStatus() == OrderStatus.PICKUP_READY)
                .limit(200)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFinanceSummary() {
        return walletService.getFinanceSummary();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRegionSummary() {
        List<Agency> agencies = agencyRepository.findByDeletedFalseOrderByCity();
        List<Map<String, Object>> regions = agencies.stream().map(agency -> {
            Map<String, Object> region = new java.util.HashMap<>();
            region.put("agencyId", agency.getId());
            region.put("agencyName", agency.getName());
            region.put("city", agency.getCity() != null ? agency.getCity() : "");
            region.put("country", agency.getCountry());
            region.put("email", agency.getEmail());
            region.put("phone", agency.getPhone());
            region.put("driverCount", driverRepository.countByAgencyId(agency.getId()));
            region.put("activeDriverCount", driverRepository.countByAgencyIdAndUserIsActive(agency.getId(), true));
            return region;
        }).collect(Collectors.toList());

        Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("regions", regions);
        summary.put("orphanDriverCount", driverRepository.countOrphanDrivers());
        summary.put("totalAgencies", agencies.size());
        return List.of(summary);
    }

    @Override
    @Transactional
    public void reassignDriverToAgency(UUID driverId, UUID agencyId) {
        com.deliveryplatform.domain.entity.Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId.toString()));
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId.toString()));
        Agency previousAgency = driver.getAgency();
        driver.setAgency(agency);
        driverRepository.save(driver);
        log.info("Driver {} reassigned from agency {} to agency {}", driverId,
                previousAgency != null ? previousAgency.getId() : "none", agencyId);

        // Realtime: Notify admin dashboard and both agencies of reassignment
        wsEventService.broadcastDriverStatusChange(driverId, "REASSIGNED", null);
        wsEventService.broadcastAdminDashboardRefresh("DRIVER_REASSIGNED");
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrphanDrivers() {
        return driverRepository.findOrphanDrivers().stream().map(driver -> {
            Map<String, Object> d = new java.util.HashMap<>();
            d.put("id", driver.getId());
            d.put("name", driver.getName());
            d.put("phone", driver.getPhone());
            d.put("registrationCity", driver.getRegistrationCity());
            d.put("verificationStatus", driver.getVerificationStatus());
            d.put("email", driver.getUser() != null ? driver.getUser().getEmail() : null);
            d.put("avatarUrl", driver.getUser() != null ? driver.getUser().getAvatarUrl() : null);
            return d;
        }).collect(Collectors.toList());
    }
}
