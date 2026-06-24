package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.dto.response.WalletResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WalletMapper {
    // Force re-generation
    WalletResponse toResponse(Wallet wallet);
}
