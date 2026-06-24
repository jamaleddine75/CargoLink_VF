package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.ShiftSummaryResponse;
import com.deliveryplatform.dto.response.WeeklyPerformanceResponse;
import com.deliveryplatform.dto.response.DriverBadgeResponse;
import com.deliveryplatform.dto.response.ShiftGoalResponse;

import java.util.List;
import java.util.UUID;

public interface ShiftService {
    ShiftSummaryResponse       startShift(UUID driverId);
    ShiftSummaryResponse       getCurrentShift(UUID driverId);
    void                       endShift(String shiftId, UUID driverId);
    WeeklyPerformanceResponse  getWeeklyPerformance(UUID driverId);
    List<DriverBadgeResponse>  getBadges(UUID driverId);
    List<ShiftGoalResponse>    getShiftGoals(UUID driverId);
    void                       recordDelivery(UUID driverId, java.math.BigDecimal earnings, java.math.BigDecimal cod, double distance);
    void                       recordFailure(UUID driverId);
}
