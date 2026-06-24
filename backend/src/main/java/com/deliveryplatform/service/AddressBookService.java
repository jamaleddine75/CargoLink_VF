package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.SavedAddressRequest;
import com.deliveryplatform.dto.response.SavedAddressResponse;

import java.util.List;
import java.util.UUID;

public interface AddressBookService {
    List<SavedAddressResponse> getSavedAddresses(UUID userId);
    SavedAddressResponse saveAddress(UUID userId, SavedAddressRequest request);
    SavedAddressResponse updateAddress(UUID userId, UUID addressId, SavedAddressRequest request);
    void deleteAddress(UUID userId, UUID addressId);
}
