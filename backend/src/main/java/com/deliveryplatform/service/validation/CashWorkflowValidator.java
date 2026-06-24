package com.deliveryplatform.service.validation;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.PaymentStatus;
import com.deliveryplatform.exception.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class CashWorkflowValidator {

    /**
     * Validates if an order is in a valid state to allow cash collection by a driver.
     */
    public void validateForCollection(Order order) {
        validateOrderState(order);

        if (order.isCashCollected()) {
            throw new BadRequestException("Cash has already been marked as collected for this order.");
        }
    }

    /**
     * Validates if an order is in a valid state to allow cash confirmation by an agency admin.
     */
    public void validateForConfirmation(Order order) {
        validateOrderState(order);

        if (!order.isCashCollected()) {
            throw new BadRequestException("Cash not collected yet");
        }

        if (order.isCashConfirmed() || order.getPaymentStatus() == PaymentStatus.CONFIRMED_BY_AGENCY) {
            throw new BadRequestException("Order already confirmed");
        }
    }

    /**
     * Common check for valid order state before any cash operation.
     */
    private void validateOrderState(Order order) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Invalid order state");
        }
    }
}
