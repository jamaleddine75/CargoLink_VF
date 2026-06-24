package com.deliveryplatform.service.validation;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.PaymentStatus;
import com.deliveryplatform.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CashWorkflowValidatorTest {

    private CashWorkflowValidator validator;
    private Order order;

    @BeforeEach
    void setUp() {
        validator = new CashWorkflowValidator();
        order = Order.builder()
                .status(OrderStatus.DELIVERED)
                .cashCollected(false)
                .cashConfirmed(false)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
    }

    @Test
    void validateForCollection_Success() {
        assertDoesNotThrow(() -> validator.validateForCollection(order));
    }

    @Test
    void validateForCollection_Fail_InvalidState() {
        order.setStatus(OrderStatus.PICKED_UP);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForCollection(order)
        );
        assertEquals("Invalid order state", ex.getMessage());
    }

    @Test
    void validateForCollection_Fail_AlreadyCollected() {
        order.setCashCollected(true);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForCollection(order)
        );
        assertEquals("Cash has already been marked as collected for this order.", ex.getMessage());
    }

    @Test
    void validateForConfirmation_Success() {
        order.setCashCollected(true);
        assertDoesNotThrow(() -> validator.validateForConfirmation(order));
    }

    @Test
    void validateForConfirmation_Fail_NotCollected() {
        order.setCashCollected(false);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForConfirmation(order)
        );
        assertEquals("Cash not collected yet", ex.getMessage());
    }

    @Test
    void validateForConfirmation_Fail_AlreadyConfirmed() {
        order.setCashCollected(true);
        order.setCashConfirmed(true);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForConfirmation(order)
        );
        assertEquals("Order already confirmed", ex.getMessage());
    }

    @Test
    void validateForConfirmation_Fail_PaymentConfirmed() {
        order.setCashCollected(true);
        order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForConfirmation(order)
        );
        assertEquals("Order already confirmed", ex.getMessage());
    }

    @Test
    void validateForConfirmation_Fail_InvalidState() {
        order.setStatus(OrderStatus.PICKED_UP);
        order.setCashCollected(true);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            validator.validateForConfirmation(order)
        );
        assertEquals("Invalid order state", ex.getMessage());
    }
}
