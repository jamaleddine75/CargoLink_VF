package com.deliveryplatform.controller;

import com.deliveryplatform.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/financial")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<Map<String, Object>> getFinancialReport(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(reportService.getFinancialReport(period));
    }

    @GetMapping("/operations")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOperationsReport(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(reportService.getOperationsReport(period));
    }
}