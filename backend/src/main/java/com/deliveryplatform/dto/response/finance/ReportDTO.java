package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private String reportId;
    private String type; // "REVENUE", "WALLET", "TRANSACTION", "PROFIT", "COD", "WITHDRAWAL"
    private String format; // "CSV", "PDF", "EXCEL"
    private String downloadUrl;
    private LocalDateTime generatedAt;
}
