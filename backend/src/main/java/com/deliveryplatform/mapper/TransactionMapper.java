package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.dto.response.TransactionResponse;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper for Transaction entity to TransactionResponse DTO.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TransactionMapper {

    @Mapping(target = "createdAt", source = "date")
    @Mapping(target = "metadata", ignore = true)
    TransactionResponse toResponse(Transaction transaction);

    // Temporarily disabled to isolate 500 error
    /*
    @AfterMapping
    default void afterMapping(@MappingTarget TransactionResponse response, Transaction transaction) {
        response.setCodAmount(transaction.getAmount());
        response.setDate(transaction.getDate());
        
        // Populate driver info if wallet and user exist
        if (transaction.getWallet() != null && transaction.getWallet().getUser() != null) {
            response.setDriverUserId(transaction.getWallet().getUser().getId());
            response.setDriverName(transaction.getWallet().getUser().getFirstName() + " " + 
                               transaction.getWallet().getUser().getLastName());
            response.setDriverPhone(transaction.getWallet().getUser().getPhoneNumber());
        }
    }
    */
}
