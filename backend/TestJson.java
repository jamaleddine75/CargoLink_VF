import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public class TestJson {
    public static void main(String[] args) throws Exception {
        com.deliveryplatform.dto.response.WalletResponse resp = new com.deliveryplatform.dto.response.WalletResponse();
        resp.setCashInHand(new java.math.BigDecimal("123.45"));
        resp.setTodayEarnings(new java.math.BigDecimal("67.89"));
        resp.setWeeklyEarnings(new java.math.BigDecimal("500.00"));
        resp.setDebtToSystem(new java.math.BigDecimal("100.00"));
        resp.setPendingCOD(new java.math.BigDecimal("50.00"));
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        System.out.println(mapper.writeValueAsString(resp));
    }
}
