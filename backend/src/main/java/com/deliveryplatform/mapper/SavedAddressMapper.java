package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.SavedAddress;
import com.deliveryplatform.dto.request.SavedAddressRequest;
import com.deliveryplatform.dto.response.SavedAddressResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SavedAddressMapper {
    SavedAddressResponse toResponse(SavedAddress address);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    SavedAddress toEntity(SavedAddressRequest request);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(SavedAddressRequest request, @MappingTarget SavedAddress address);
}
