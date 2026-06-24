package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/orders")
@RequiredArgsConstructor
@Slf4j
public class DriverOrderController {

    private final OrderService orderService;

    /**
     * PUT /api/driver/orders/{id}/collect-cash
     * Marks an order as cash collected by the driver.
     */
    @PutMapping("/{id}/collect-cash")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<OrderResponse> collectCash(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable java.util.UUID id) {
        log.info("Driver {} is marking order {} as cash collected", principal.getId(), id);
        return ResponseEntity.ok(orderService.collectCash(id, principal.getId()));
    }
}
