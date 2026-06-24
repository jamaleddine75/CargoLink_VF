package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.SavedAddress;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.request.SavedAddressRequest;
import com.deliveryplatform.dto.response.SavedAddressResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.mapper.SavedAddressMapper;
import com.deliveryplatform.repository.SavedAddressRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.service.AddressBookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressBookServiceImpl implements AddressBookService {

    private final SavedAddressRepository savedAddressRepository;
    private final UserRepository userRepository;
    private final SavedAddressMapper savedAddressMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SavedAddressResponse> getSavedAddresses(UUID userId) {
        return savedAddressRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(savedAddressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SavedAddressResponse saveAddress(UUID userId, SavedAddressRequest request) {
        log.debug("Attempting to save address '{}' for user {}", request.getLabel(), userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });
        
        try {
            SavedAddress address = savedAddressMapper.toEntity(request);
            address.setUser(user);
            
            SavedAddress saved = savedAddressRepository.save(address);
            log.info("Successfully saved address '{}' (ID: {}) for user {}", request.getLabel(), saved.getId(), userId);
            return savedAddressMapper.toResponse(saved);
        } catch (Exception e) {
            log.error("Failed to save address '{}' for user {}: {}", request.getLabel(), userId, e.getMessage());
            throw new BusinessException("Could not save address. Please check your data.");
        }
    }

    @Override
    @Transactional
    public SavedAddressResponse updateAddress(UUID userId, UUID addressId, SavedAddressRequest request) {
        SavedAddress address = savedAddressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("SavedAddress", "id", addressId));
        
        if (!address.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied: Address does not belong to user");
        }
        
        savedAddressMapper.updateEntity(request, address);
        SavedAddress updated = savedAddressRepository.save(address);
        log.info("Updated address '{}' for user {}", addressId, userId);
        return savedAddressMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        SavedAddress address = savedAddressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("SavedAddress", "id", addressId));
        
        if (!address.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied: Address does not belong to user");
        }
        
        savedAddressRepository.delete(address);
        log.info("Deleted address '{}' for user {}", addressId, userId);
    }
}
