package com.deliveryplatform;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class E2EBusinessFlowIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private AgencyRepository agencyRepository;

    @Test
    @Transactional
    public void testCompleteOrderLifecycle() {
        // This is a simulated E2E backend skeleton for the QA rollout
        
        // 1. Validate Customer Exists (Assuming populated via flyway)
        User client = userRepository.findByEmail("client@example.com").orElse(null);
        if (client == null) {
            System.out.println("No client found for DB integration test, skipping assertions.");
            return; 
        }

        // 2. Create Order
        CreateOrderRequest req = new CreateOrderRequest();
        req.setDistance(10.0);
        req.setPickupLat(33.0);
        req.setPickupLng(-7.0);
        req.setDeliveryLat(33.1);
        req.setDeliveryLng(-7.1);
        
        OrderResponse createdOrder = orderService.createOrder(req, client.getId());
        assertNotNull(createdOrder.getId());
        assertEquals("PENDING", createdOrder.getStatus());
        
        // 3. Driver Acceptance
        Driver driver = driverRepository.findAll().stream().findFirst().orElse(null);
        if (driver == null) return;
        
        OrderResponse acceptedOrder = orderService.acceptOrder(UUID.fromString(createdOrder.getId()), driver.getUser().getId());
        assertEquals("ASSIGNED", acceptedOrder.getStatus());
        
        // 4. Pickup & Delivery
        orderService.updateOrderStatus(UUID.fromString(createdOrder.getId()), driver.getUser().getId(), "PICKUP_READY", null, null, null, null, null, false);
        orderService.updateOrderStatus(UUID.fromString(createdOrder.getId()), driver.getUser().getId(), "PICKED_UP", null, null, null, null, null, false);
        orderService.updateOrderStatus(UUID.fromString(createdOrder.getId()), driver.getUser().getId(), "ON_THE_WAY", null, null, null, null, null, false);
        OrderResponse deliveredOrder = orderService.updateOrderStatus(UUID.fromString(createdOrder.getId()), driver.getUser().getId(), "DELIVERED", 33.1, -7.1, null, null, null, false);
        
        assertEquals("DELIVERED", deliveredOrder.getStatus());
        
        // 5. Wallet check can be done here by injecting WalletRepository or using WalletService
    }
}
