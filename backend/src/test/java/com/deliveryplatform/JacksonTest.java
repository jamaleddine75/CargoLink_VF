package com.deliveryplatform;

import com.deliveryplatform.dto.response.WalletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

public class JacksonTest {

    @Test
    public void testJson() throws Exception {
        WalletResponse resp = WalletResponse.builder()
            .cashInHand(new java.math.BigDecimal("123.45"))
            .todayEarnings(new java.math.BigDecimal("67.89"))
            .weeklyEarnings(new java.math.BigDecimal("500.00"))
            .debtToSystem(new java.math.BigDecimal("100.00"))
            .pendingCOD(new java.math.BigDecimal("50.00"))
            .build();
            
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        System.out.println("JSON_OUTPUT_START");
        System.out.println(mapper.writeValueAsString(resp));
        System.out.println("JSON_OUTPUT_END");
    }
}
