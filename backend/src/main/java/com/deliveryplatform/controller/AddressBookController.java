package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.SavedAddressRequest;
import com.deliveryplatform.dto.response.SavedAddressResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.AddressBookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/address-book")
@RequiredArgsConstructor
@Slf4j
public class AddressBookController {

    private final AddressBookService addressBookService;

    @GetMapping
    public ResponseEntity<List<SavedAddressResponse>> getSavedAddresses(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(addressBookService.getSavedAddresses(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<SavedAddressResponse> saveAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SavedAddressRequest request) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(addressBookService.saveAddress(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedAddressResponse> updateAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SavedAddressRequest request) {
        return ResponseEntity.ok(addressBookService.updateAddress(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        addressBookService.deleteAddress(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
