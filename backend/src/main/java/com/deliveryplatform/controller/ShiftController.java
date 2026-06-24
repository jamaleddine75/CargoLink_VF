package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.ShiftSummaryResponse;
import com.deliveryplatform.dto.response.WeeklyPerformanceResponse;
import com.deliveryplatform.dto.response.DriverBadgeResponse;
import com.deliveryplatform.dto.response.ShiftGoalResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    /**
     * POST /api/drivers/shift/start
     * Starts a new shift for the authenticated driver (or returns active one).
     */
    @PostMapping("/shift/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ShiftSummaryResponse> startShift(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(shiftService.startShift(principal.getId()));
    }

    /**
     * GET /api/drivers/shift/current
     * Returns the authenticated driver's active shift stats.
     * Polled every 60s by useShiftPerformance hook.
     */
    @GetMapping("/shift/current")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ShiftSummaryResponse> getCurrentShift(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(shiftService.getCurrentShift(principal.getId()));
        } catch (Exception e) {
            return ResponseEntity.ok(ShiftSummaryResponse.builder()
                .isActive(false)
                .totalEarnings(0.0)
                .totalDeliveries(0)
                .build());
        }
    }

    /**
     * POST /api/drivers/shift/{shiftId}/end
     * Closes the shift, calculates final totals, records endedAt.
     */
    @PostMapping("/shift/{shiftId}/end")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> endShift(
            @PathVariable String shiftId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            shiftService.endShift(shiftId, principal.getId());
        } catch (Exception e) {
            // Log error but don't fail the response if possible, or return bad request
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/drivers/performance/weekly
     * 7-day delivery/earnings breakdown + agency rank.
     */
    @GetMapping("/performance/weekly")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<WeeklyPerformanceResponse> getWeeklyPerformance(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(shiftService.getWeeklyPerformance(principal.getId()));
        } catch (Exception e) {
            return ResponseEntity.ok(WeeklyPerformanceResponse.builder()
                .totalEarnings(0.0)
                .totalDeliveries(0)
                .build());
        }
    }

    /**
     * GET /api/drivers/badges
     * All earned badges for the driver, ordered by earnedAt DESC.
     */
    @GetMapping("/badges")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<DriverBadgeResponse>> getBadges(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(shiftService.getBadges(principal.getId()));
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    /**
     * GET /api/drivers/shift/goals
     * Today's goal progress (deliveries, earnings, success rate, distance).
     */
    @GetMapping("/shift/goals")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<ShiftGoalResponse>> getShiftGoals(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(shiftService.getShiftGoals(principal.getId()));
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}
