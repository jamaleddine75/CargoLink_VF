package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.request.LoginRequest;
import com.deliveryplatform.dto.request.RegisterRequest;
import com.deliveryplatform.dto.response.JwtAuthResponse;
import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.security.JwtTokenProvider;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final WalletRepository walletRepository;
    private final AgencyRepository agencyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final com.deliveryplatform.service.AgencyDiscoveryService agencyDiscoveryService;


    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    @Override
    public JwtAuthResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = principal.getUser();

            // FIX: Auto-repair for Demo Agency Admins missing agency association
            if (demoMode && user.getRole().isAgencyRole() && user.getAgency() == null && user.getEmail().endsWith("@cargolink.ma")) {
                log.info("Auto-repairing agency association for demo user: {}", user.getEmail());
                Agency demoAgency = agencyRepository.findAll().stream()
                        .filter(a -> a.getName().contains("Demo") || a.getName().contains("CargoLink"))
                        .findFirst()
                        .orElseGet(() -> {
                            Agency newAgency = Agency.builder()
                                    .name("Demo Agency")
                                    .email("demo@cargolink.com")
                                    .city("Casablanca")
                                    .adminAgency(user)
                                    .build();

                            return agencyRepository.save(newAgency);
                        });
                user.setAgency(demoAgency);
                userRepository.save(user);
                
                // Re-authenticate to update principal with new agency association
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                loginRequest.getEmail(),
                                loginRequest.getPassword()
                        )
                );
                principal = (UserPrincipal) authentication.getPrincipal();
            }

            String token = tokenProvider.generateToken(authentication);

            return JwtAuthResponse.builder()
                    .token(token)
                    .email(principal.getUsername())
                    .role(principal.getUser().getRole() != null ? principal.getUser().getRole().toApiValue() : null)
                    .firstName(principal.getUser().getFirstName())
                    .lastName(principal.getUser().getLastName())
                    .build();

        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            // FIX BB-10: Use SLF4J instead of System.err.println
            log.warn("Login failed: bad credentials for email {}", loginRequest.getEmail());
            throw e;
        } catch (org.springframework.security.authentication.DisabledException e) {
            log.warn("Login failed: account disabled for email {}", loginRequest.getEmail());
            var user = userRepository.findByEmail(loginRequest.getEmail());
            if (user.isPresent()) {
                log.debug("User {} isActive={}, status={}", loginRequest.getEmail(),
                        user.get().isActive(), user.get().getStatus());
                throw new RuntimeException("Account is under review and not yet approved. Please contact support.");
            }
            throw e;
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            log.warn("Login failed: user not found for email {}", loginRequest.getEmail());
            throw new RuntimeException("Invalid email or password");
        } catch (Exception e) {
            log.error("Login error: {} - {}", e.getClass().getName(), e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public JwtAuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        // NOTE: Demo bypass must be removed before production launch.
        // TODO: Remove @cargolink.ma bypass and enforce proper approval flow.
        boolean isDemo = demoMode && registerRequest.getEmail().endsWith("@cargolink.ma");

        User user = User.builder()
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .phoneNumber(registerRequest.getPhoneNumber())
                .role(registerRequest.getRole())
                .isActive(isDemo)
                .status(isDemo ? UserStatus.APPROVED : UserStatus.PENDING)
                .build();

        userRepository.save(user);

        if (user.getRole() == Role.DRIVER) {
            // Find agency for driver based on city/coordinates
            Agency assignedAgency = agencyDiscoveryService.discoverNearestAgency(
                    registerRequest.getCity(), 
                    registerRequest.getLatitude(), 
                    registerRequest.getLongitude()
            );

            Driver driver = Driver.builder()
                    .name((registerRequest.getFirstName() + " " + registerRequest.getLastName()).trim())
                    .phone(registerRequest.getPhoneNumber())
                    .user(user)
                    .agency(assignedAgency)
                    .registrationCity(registerRequest.getCity())
                    .vehicleType(registerRequest.getVehicleType() != null
                            ? VehicleType.valueOf(registerRequest.getVehicleType().toUpperCase()) : null)
                    .licenseNumber(registerRequest.getLicenseNumber())
                    .documents(registerRequest.getDocuments())
                    .build();
            driverRepository.save(driver);

            Wallet wallet = Wallet.builder()
                    .user(user).walletType(WalletType.DRIVER).balance(java.math.BigDecimal.ZERO).isFrozen(false).build();
            walletRepository.save(wallet);

        } else if (user.getRole() == Role.CUSTOMER) {
            // Find agency for customer based on city/coordinates
            Agency assignedAgency = agencyDiscoveryService.discoverNearestAgency(
                    registerRequest.getCity(), 
                    registerRequest.getLatitude(), 
                    registerRequest.getLongitude()
            );
            
            // Link the User account to the agency for multi-tenancy
            user.setAgency(assignedAgency);
            userRepository.save(user);

            ClientProfile client = ClientProfile.builder()
                    .user(user)
                    .companyName(registerRequest.getCompanyName())
                    .taxId(registerRequest.getTaxId())
                    .billingAddress(registerRequest.getAddress())
                    .build();
            clientProfileRepository.save(client);


            Wallet wallet = Wallet.builder()
                    .user(user).walletType(WalletType.CUSTOMER).balance(java.math.BigDecimal.ZERO).isFrozen(false).build();
            walletRepository.save(wallet);
        } else if (user.getRole() == Role.AGENCY_ADMIN || user.getRole() == Role.AGENCY) {
            Agency agency = Agency.builder()
                    .name(registerRequest.getCompanyName() != null ? registerRequest.getCompanyName() : "Agency " + user.getLastName())
                    .email(user.getEmail())
                    .adminAgency(user)
                    .taxId(registerRequest.getTaxId())
                    .build();
            agencyRepository.save(agency);
            
            user.setAgency(agency);
            userRepository.save(user);
        }

        String message = isDemo
                ? "Demo registration successful. Account is immediately active."
                : "Registration successful. Your account is pending approval.";

        return JwtAuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().toApiValue())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .message(message)
                .build();
    }

    @Override
    @Transactional
    public void registerDriverForAgency(RegisterRequest registerRequest, User createdBy) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        Agency agency = createdBy.getAgency();
        if (agency == null && createdBy.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only Admins and Agencies can create drivers directly.");
        }

        User user = User.builder()
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .phoneNumber(registerRequest.getPhoneNumber())
                .role(Role.DRIVER)
                .isActive(true)
                .status(UserStatus.APPROVED)
                .build();

        userRepository.save(user);

        Driver driver = Driver.builder()
                .name((registerRequest.getFirstName() + " " + registerRequest.getLastName()).trim())
                .phone(registerRequest.getPhoneNumber())
                .user(user)
                .agency(agency)
                .registrationCity(registerRequest.getCity() != null ? registerRequest.getCity() : (agency != null ? agency.getCity() : null))
                .vehicleType(registerRequest.getVehicleType() != null
                        ? VehicleType.valueOf(registerRequest.getVehicleType().toUpperCase()) : null)
                .licenseNumber(registerRequest.getLicenseNumber())
                .documents(registerRequest.getDocuments())
                // Drivers created by agency are automatically approved and working
                .status(com.deliveryplatform.domain.entity.DriverStatus.ONLINE)
                .workPermissionUntil(java.time.LocalDateTime.now().plusYears(1))
                .build();
        driverRepository.save(driver);

        Wallet wallet = Wallet.builder()
                .user(user).walletType(WalletType.DRIVER).balance(java.math.BigDecimal.ZERO).isFrozen(false).build();
        walletRepository.save(wallet);
    }

    /**
     * FIX BS-13: Moved from AuthController to service layer.
     * Returns Optional.empty() if user not found — caller always returns 200
     * to prevent email enumeration.
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getAccountStatus(String email) {
        return userRepository.findByEmail(email).map(user -> {
            Map<String, Object> body = new HashMap<>();
            body.put("status", user.getStatus().name());
            driverRepository.findByUserEmail(email).ifPresent(driver -> {
                if (driver.getRejectionReason() != null) {
                    body.put("rejectionReason", driver.getRejectionReason());
                }
            });
            return body;
        });
    }
}
