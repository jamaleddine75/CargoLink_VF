package com.deliveryplatform.service.impl;

import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public Map<String, Object> getFinancialReport(String period) {
        Map<String, Object> report = new HashMap<>();
        report.put("period", period);
        report.put("totalOrders", orderRepository.count());
        report.put("totalTransactions", transactionRepository.count());
        return report;
    }

    @Override
    public Map<String, Object> getOperationsReport(String period) {
        Map<String, Object> report = new HashMap<>();
        report.put("period", period);
        report.put("totalOrders", orderRepository.count());
        return report;
    }
}