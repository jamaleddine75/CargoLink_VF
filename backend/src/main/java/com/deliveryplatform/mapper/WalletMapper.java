package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.dto.response.WalletResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WalletMapper {
    @Mapping(target = "balance", source = "balance")
    WalletResponse toResponse(Wallet wallet);
}
