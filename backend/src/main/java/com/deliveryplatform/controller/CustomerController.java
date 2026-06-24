package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.UserResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final UserService userService;

    @GetMapping({"/profile", "/customer/profile"})
    public ResponseEntity<UserResponse> getCustomerProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }
}
