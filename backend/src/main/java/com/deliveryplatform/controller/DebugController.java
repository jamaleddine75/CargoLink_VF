package com.deliveryplatform.controller;

import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.service.WalletService;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {
    private final OrderService orderService;
    private final WalletService walletService;
    private final OrderRepository orderRepository;

    @jakarta.annotation.PostConstruct
    public void runDebug() {
        System.out.println("================ EXECUTING DEBUG LOGIC ==================");
        try {
            Order order = orderRepository.findById(UUID.fromString("dab2e3a3-6f55-4960-9d09-0e39fef34fae")).orElseThrow();
            if (order.getStatus() != com.deliveryplatform.domain.entity.OrderStatus.DELIVERED) {
                walletService.handleOrderDelivery(order, true);
                order.setStatus(com.deliveryplatform.domain.entity.OrderStatus.DELIVERED);
                order.setDeliveredAt(java.time.LocalDateTime.now());
                orderRepository.save(order);
                System.out.println("ORDER DELIVERED AND WALLET UPDATED!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PostMapping("/deliver/{orderId}")
    public Object forceDeliver(@PathVariable UUID orderId) {
        try {
            Order order = orderRepository.findById(orderId).orElseThrow();
            // Call exactly what batchUpdateOrderStatus does to simulate a successful delivery without geofencing
            walletService.handleOrderDelivery(order, true);
            order.setStatus(com.deliveryplatform.domain.entity.OrderStatus.DELIVERED);
            order.setDeliveredAt(java.time.LocalDateTime.now());
            orderRepository.save(order);
            return "SUCCESS";
        } catch (Exception e) {
            return e.getMessage();
        }
    }
}
