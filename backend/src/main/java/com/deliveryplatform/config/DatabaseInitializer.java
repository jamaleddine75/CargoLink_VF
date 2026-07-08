package com.deliveryplatform.config;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@Profile("dev")
@ConditionalOnProperty(name="app.seed.enabled", havingValue="true", matchIfMissing=false)
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final AgencyRepository agencyRepository;
    private final WalletRepository walletRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final PlatformWalletRepository platformWalletRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeDatabase() {
        log.info("DatabaseInitializer: Checking if database needs to be seeded...");

        if (userRepository.findByEmail("client@cargolink.ma").isPresent()) {
            log.info("DatabaseInitializer: Demo users already exist. Skipping initialization.");
            return;
        }

        log.info("DatabaseInitializer: Seeding default database settings and demo users...");

        // 1. Seed System Settings
        if (systemSettingsRepository.count() == 0) {
            SystemSettings settings = SystemSettings.builder()
                    .platformName("CargoLink")
                    .currency("MAD")
                    .timezone("UTC+1")
                    .maintenanceMode(false)
                    .jwtExpiry(86400000L)
                    .build();
            systemSettingsRepository.save(settings);
            log.info("DatabaseInitializer: Seeded system settings.");
        }

        // 2. Seed Platform Wallet
        if (platformWalletRepository.count() == 0) {
            PlatformWallet platformWallet = PlatformWallet.builder()
                    .balance(BigDecimal.ZERO)
                    .totalRevenue(BigDecimal.ZERO)
                    .platformProfit(BigDecimal.ZERO)
                    .totalDriverPayout(BigDecimal.ZERO)
                    .totalAgencyPayout(BigDecimal.ZERO)
                    .build();
            platformWalletRepository.save(platformWallet);
            log.info("DatabaseInitializer: Seeded platform wallet.");
        }

        // 3. Create Admin User
        User adminUser = User.builder()
                .email("admin@cargolink.ma")
                .password(passwordEncoder.encode("demo123"))
                .firstName("Demo")
                .lastName("Admin")
                .phoneNumber("1234567892")
                .role(Role.ADMIN)
                .isActive(true)
                .status(UserStatus.ACTIVE)
                .build();
        adminUser = userRepository.save(adminUser);
        log.info("DatabaseInitializer: Seeded admin user.");

        // 4. Create Agency User & Agency
        User agencyUser = User.builder()
                .email("agency@cargolink.ma")
                .password(passwordEncoder.encode("demo123"))
                .firstName("Demo")
                .lastName("Agency")
                .phoneNumber("1234567893")
                .role(Role.AGENCY_ADMIN)
                .isActive(true)
                .status(UserStatus.ACTIVE)
                .build();
        agencyUser = userRepository.save(agencyUser);

        Agency agency = Agency.builder()
                .name("CargoLink Casablanca Central")
                .address("Maarif 12, Casablanca")
                .contactInfo("0522-123456")
                .email("agency@cargolink.ma")
                .phone("0522-123456")
                .city("Casablanca")
                .country("Morocco")
                .adminAgency(agencyUser)
                .commissionRate(new BigDecimal("0.15"))
                .operationalStatus("ACTIVE")
                .build();
        agency = agencyRepository.save(agency);

        AgencyWallet agencyWallet = AgencyWallet.builder()
                .agency(agency)
                .balance(BigDecimal.ZERO)
                .currentBalance(BigDecimal.ZERO)
                .totalRevenue(BigDecimal.ZERO)
                .totalExpenses(BigDecimal.ZERO)
                .totalProfit(BigDecimal.ZERO)
                .pendingReceivables(BigDecimal.ZERO)
                .pendingPayables(BigDecimal.ZERO)
                .totalCommissionEarned(BigDecimal.ZERO)
                .pendingCommission(BigDecimal.ZERO)
                .commissionRate(BigDecimal.valueOf(0.15))
                .totalCollected(BigDecimal.ZERO)
                .totalPaidOut(BigDecimal.ZERO)
                .build();
        agencyWalletRepository.save(agencyWallet);

        agencyUser.setAgency(agency);
        userRepository.save(agencyUser);
        log.info("DatabaseInitializer: Seeded agency and agency admin.");

        // 5. Create Client User & Client Profile & Wallet
        User clientUser = User.builder()
                .email("client@cargolink.ma")
                .password(passwordEncoder.encode("demo123"))
                .firstName("Demo")
                .lastName("Client")
                .phoneNumber("1234567890")
                .role(Role.CUSTOMER)
                .isActive(true)
                .status(UserStatus.ACTIVE)
                .agency(agency)
                .build();
        clientUser = userRepository.save(clientUser);

        ClientProfile clientProfile = ClientProfile.builder()
                .user(clientUser)
                .companyName("Demo Client Corp")
                .billingAddress("Maarif 12, Casablanca")
                .taxId("TX-123456")
                .build();
        clientProfileRepository.save(clientProfile);

        Wallet clientWallet = Wallet.builder()
                .user(clientUser)
                .balance(new BigDecimal("5000.00"))
                .walletType(WalletType.CUSTOMER)
                .build();
        walletRepository.save(clientWallet);
        log.info("DatabaseInitializer: Seeded client user, profile, and wallet.");

        // 6. Create Driver User & Driver Profile & Wallet
        User driverUser = User.builder()
                .email("driver@cargolink.ma")
                .password(passwordEncoder.encode("demo123"))
                .firstName("Demo")
                .lastName("Driver")
                .phoneNumber("1234567891")
                .role(Role.DRIVER)
                .isActive(true)
                .status(UserStatus.ACTIVE)
                .agency(agency)
                .build();
        driverUser = userRepository.save(driverUser);

        Driver driver = Driver.builder()
                .name("Demo Driver")
                .phone("1234567891")
                .user(driverUser)
                .agency(agency)
                .registrationCity("Casablanca")
                .vehicleType(VehicleType.VAN)
                .licenseNumber("L-99887766")
                .verificationStatus(UserStatus.APPROVED)
                .status(DriverStatus.ONLINE)
                .availability(DriverAvailability.AVAILABLE)
                .build();
        driver = driverRepository.save(driver);

        Wallet driverWallet = Wallet.builder()
                .user(driverUser)
                .balance(new BigDecimal("1250.75"))
                .walletType(WalletType.DRIVER)
                .build();
        walletRepository.save(driverWallet);
        log.info("DatabaseInitializer: Seeded driver user, profile, and wallet.");

        // 7. Seed sample orders
        seedOrders(clientUser, driver, agency);

        // 8. Repair any invalid PINs in existing demo data
        repairInvalidPins();

        log.info("DatabaseInitializer: Seeding and repair complete!");
    }

    private void repairInvalidPins() {
        log.info("DatabaseInitializer: Checking and repairing invalid delivery PINs...");
        java.util.List<Order> allOrders = orderRepository.findAll();
        int repairedCount = 0;
        String defaultHashedPin = passwordEncoder.encode("0000");

        for (Order order : allOrders) {
            String pin = order.getDeliveryProofPin();
            boolean isInvalid = pin == null || 
                                pin.trim().isEmpty() || 
                                (!pin.startsWith("$2a$") && !pin.startsWith("$2y$"));
            if (isInvalid) {
                order.setDeliveryProofPin(defaultHashedPin);
                orderRepository.save(order);
                repairedCount++;
            }
        }
        if (repairedCount > 0) {
            log.info("DatabaseInitializer: Repaired {} orders with invalid delivery PINs.", repairedCount);
        }
    }

    private void seedOrders(User client, Driver driver, Agency agency) {
        String defaultHashedPin = passwordEncoder.encode("0000");

        // Order 1: Delivered
        Order order1 = Order.builder()
                .trackingNumber("CL24001ABC")
                .status(OrderStatus.DELIVERED)
                .pickupAddress("Sidi Maalouf, Casablanca")
                .deliveryAddress("Mohammedia Central")
                .pickupContactName("Ahmed Tazi")
                .receiverName("Sara Benani")
                .receiverPhone("0612345678")
                .codAmount(new BigDecimal("450.00"))
                .codCollected(true)
                .client(client)
                .driver(driver)
                .agency(agency)
                .deliveryProofPin(defaultHashedPin)
                .deliveredAt(LocalDateTime.now().minusDays(1))
                .build();
        orderRepository.save(order1);

        // Order 2: En Route
        Order order2 = Order.builder()
                .trackingNumber("CL24003ACT")
                .status(OrderStatus.ON_THE_WAY)
                .pickupAddress("Ain Diab, Casa")
                .deliveryAddress("Bouskoura Ville")
                .pickupContactName("Fatima Zahra")
                .receiverName("Omar Radi")
                .receiverPhone("0777112233")
                .codAmount(new BigDecimal("890.00"))
                .codCollected(false)
                .client(client)
                .driver(driver)
                .agency(agency)
                .deliveryProofPin(defaultHashedPin)
                .pickupDate(LocalDateTime.now().minusHours(1))
                .build();
        orderRepository.save(order2);

        // Order 3: Assigned
        Order order3 = Order.builder()
                .trackingNumber("CL24004PEN")
                .status(OrderStatus.ASSIGNED)
                .pickupAddress("Derb Ghallef")
                .deliveryAddress("Bourgogne")
                .pickupContactName("Store Moroccan Goods")
                .receiverName("Youssef Mansouri")
                .receiverPhone("0661998877")
                .codAmount(new BigDecimal("120.00"))
                .client(client)
                .driver(driver)
                .agency(agency)
                .deliveryProofPin(defaultHashedPin)
                .build();
        orderRepository.save(order3);

        // Order 4: Pending (No Driver)
        Order order4 = Order.builder()
                .trackingNumber("TET-2026-02")
                .status(OrderStatus.PENDING)
                .pickupAddress("Rue Tarik Ibn Ziad, Tétouan")
                .deliveryAddress("Bni Makada, Tétouan")
                .pickupContactName("Atelier Rif")
                .receiverName("Sara Nadori")
                .receiverPhone("0677001122")
                .codAmount(new BigDecimal("320.00"))
                .client(client)
                .agency(agency)
                .deliveryProofPin(defaultHashedPin)
                .build();
        orderRepository.save(order4);
        
        log.info("DatabaseInitializer: Seeded sample orders.");
    }
}
