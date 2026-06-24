package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyEarningsResponse {
    private LocalDate date;             // Date (YYYY-MM-DD)
    private java.math.BigDecimal earnings;            // Total earnings that day
    private int ordersCompleted;        // Number of orders completed
    private java.math.BigDecimal averagePayout;       // earnings / ordersCompleted
}
